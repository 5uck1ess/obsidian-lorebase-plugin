import { App, Modal, setIcon } from 'obsidian';
import { t } from '../localization';

export interface RelocateModalCallbacks {
    onMove: () => Promise<void>;
    onChangeOnly: () => void;
    onCancel: () => Promise<void>;
}

/** Confirmation modal offering to move existing library notes when the folder changes. */
export class RelocateConfirmModal extends Modal {
    private resolved = false;

    constructor(
        app: App,
        private readonly count: number,
        private readonly fromPath: string,
        private readonly toPath: string,
        private readonly callbacks: RelocateModalCallbacks,
    ) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('lorebase-reset-modal');
        this.modalEl.addClass('lorebase-reset-modal-container');

        const header = contentEl.createDiv({ cls: 'lorebase-reset-header' });
        const headerIcon = header.createDiv({ cls: 'lorebase-reset-icon' });
        setIcon(headerIcon, 'folder-input');
        header.createEl('h2', { text: t('relocateTitle') });
        header.createEl('p', { cls: 'lorebase-reset-subtitle', text: t('relocateBody') });

        const details = contentEl.createDiv({ cls: 'lorebase-reset-warning' });
        details.createDiv({ text: `${this.count} ${t('relocateNotesLabel')}` });
        details.createDiv({ text: `${t('relocateFromLabel')}: ${this.fromPath || '/'}` });
        details.createDiv({ text: `${t('relocateToLabel')}: ${this.toPath || '/'}` });

        const buttons = contentEl.createDiv({ cls: 'lorebase-delete-buttons' });

        const cancelBtn = buttons.createEl('button', {
            text: t('deleteCancel'),
            cls: 'lorebase-btn',
        });
        cancelBtn.addEventListener('click', () => {
            this.resolved = true;
            cancelBtn.disabled = true;
            void this.callbacks.onCancel()
                .catch((error: unknown) => {
                    console.error('Lorebase: relocate cancel failed', error);
                })
                .finally(() => this.close());
        });

        const changeOnlyBtn = buttons.createEl('button', {
            text: t('relocateChangeOnly'),
            cls: 'lorebase-btn',
        });
        changeOnlyBtn.addEventListener('click', () => {
            this.resolved = true;
            this.callbacks.onChangeOnly();
            this.close();
        });

        const moveBtn = buttons.createEl('button', {
            text: t('relocateMove'),
            cls: 'lorebase-btn lorebase-btn-primary',
        });
        moveBtn.addEventListener('click', () => {
            this.resolved = true;
            moveBtn.disabled = true;
            moveBtn.textContent = '...';
            void this.callbacks.onMove()
                .catch((error: unknown) => {
                    console.error('Lorebase: relocate failed', error);
                })
                .finally(() => this.close());
        });
    }

    onClose(): void {
        // Closing via Esc / click-outside without choosing = cancel (revert).
        if (!this.resolved) {
            this.resolved = true;
            void this.callbacks.onCancel().catch((error: unknown) => {
                console.error('Lorebase: relocate cancel failed', error);
            });
        }
        this.modalEl.removeClass('lorebase-reset-modal-container');
        this.contentEl.empty();
    }
}
