import { App, TFile, TFolder } from 'obsidian';
import { getAllMarkdownFiles } from './media/serviceUtils';
import { relocatedPath, uniqueVaultPath } from './relocateUtils';

export interface RelocateResult {
    moved: number;
    failed: string[];
}

export class RelocateService {
    constructor(private readonly app: App) {}

    /** Collect markdown files in a library folder that parse as its media type. */
    collectMovableNotes(folderPath: string, isMatch: (file: TFile) => boolean): TFile[] {
        const folder = folderPath
            ? this.app.vault.getAbstractFileByPath(folderPath)
            : this.app.vault.getRoot();
        if (!(folder instanceof TFolder)) return [];
        return getAllMarkdownFiles(folder).filter((file) => isMatch(file));
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
                (path) => claimed.has(path) || this.app.vault.getAbstractFileByPath(path) !== null,
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

        const parent = filePath.slice(0, slash);
        const existing = this.app.vault.getAbstractFileByPath(parent);
        if (existing instanceof TFolder) return;
        if (existing !== null) {
            throw new Error(`Lorebase: parent path '${parent}' is a file, cannot create folder`);
        }
        await this.app.vault.createFolder(parent);
    }
}
