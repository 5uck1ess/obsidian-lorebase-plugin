import { App, TFile, TFolder } from 'obsidian';
import { getAllMarkdownFiles } from './media/serviceUtils';
import { relocatedPath, uniqueVaultPath } from './relocateUtils';

export interface RelocateResult {
    moved: number;
    failed: string[];
}

export class RelocateService {
    constructor(private readonly app: App) {}

    /** Collect Markdown notes in a library folder that parse as its media type. */
    collectMovableNotes(folderPath: string, isMatch: (file: TFile) => boolean): TFile[] {
        const folder = folderPath
            ? this.app.vault.getAbstractFileByPath(folderPath)
            : this.app.vault.getRoot();
        if (!(folder instanceof TFolder)) return [];
        return getAllMarkdownFiles(folder).filter(isMatch);
    }

    /** Move notes while preserving relative paths and avoiding collisions. */
    async relocateNotes(notes: TFile[], oldFolder: string, newFolder: string): Promise<RelocateResult> {
        const claimed = new Set<string>();
        const failed: string[] = [];
        let moved = 0;

        for (const file of notes) {
            const desired = relocatedPath(file.path, oldFolder, newFolder);
            const destination = uniqueVaultPath(
                desired,
                (path) => claimed.has(path) || this.app.vault.getAbstractFileByPath(path) !== null
            );
            claimed.add(destination);

            try {
                await this.ensureParentFolder(destination);
                await this.app.fileManager.renameFile(file, destination);
                moved++;
            } catch (error) {
                console.error(`Lorebase: failed to move ${file.path} -> ${destination}`, error);
                failed.push(file.path);
            }
        }

        return { moved, failed };
    }

    private async ensureParentFolder(filePath: string): Promise<void> {
        const slash = filePath.lastIndexOf('/');
        if (slash <= 0) return;

        const parts = filePath.slice(0, slash).split('/').filter(Boolean);
        let current = '';
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            const existing = this.app.vault.getAbstractFileByPath(current);
            if (existing instanceof TFolder) continue;
            if (existing !== null) {
                throw new Error(`Lorebase: parent path '${current}' is a file, cannot create folder`);
            }
            await this.app.vault.createFolder(current);
        }
    }
}
