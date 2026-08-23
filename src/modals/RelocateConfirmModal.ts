import { App, Modal, setIcon } from 'obsidian';
import { t } from '../localization';

export interface RelocateModalCallbacks {
    onMove: () => Promise<void>;
    onChangeOnly: () => void;
    onCancel: () => Promise<void>;
}

/** Offer to move existing notes, change only the setting, or cancel. */
export class RelocateConfirmModal extends Modal {
    private resolved = false;

    constructor(
        app: App,
        private readonly count: number,
        private readonly fromPath: string,
        private readonly toPath: string,
        private readonly callbacks: RelocateModalCallbacks
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
        const cancel = buttons.createEl('button', { text: t('deleteCancel'), cls: 'lorebase-btn' });
        cancel.addEventListener('click', () => {
            this.resolved = true;
            cancel.disabled = true;
            void this.callbacks.onCancel()
                .catch((error: unknown) => console.error('Lorebase: relocate cancel failed', error))
                .finally(() => this.close());
        });

        const changeOnly = buttons.createEl('button', {
            text: t('relocateChangeOnly'),
            cls: 'lorebase-btn',
        });
        changeOnly.addEventListener('click', () => {
            this.resolved = true;
            this.callbacks.onChangeOnly();
            this.close();
        });

        const move = buttons.createEl('button', {
            text: t('relocateMove'),
            cls: 'lorebase-btn lorebase-btn-primary',
        });
        move.addEventListener('click', () => {
            this.resolved = true;
            move.disabled = true;
            move.textContent = '...';
            void this.callbacks.onMove()
                .catch((error: unknown) => console.error('Lorebase: relocate failed', error))
                .finally(() => this.close());
        });
    }

    onClose(): void {
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
