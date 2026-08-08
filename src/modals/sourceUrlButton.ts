import { Notice, setIcon } from 'obsidian';
import { t } from '../localization';

function normalizeUrl(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^(https?:\/\/|obsidian:\/\/)/i.test(trimmed)) return trimmed;
    if (/^[^\s]+\.[^\s]+$/.test(trimmed)) return `https://${trimmed}`;
    return null;
}

export function bindSourceUrlButton(root: HTMLElement): void {
    const input = root.querySelector<HTMLInputElement>('[data-field="source-url"]');
    const button = root.querySelector<HTMLButtonElement>('[data-action="open-source-url"]');
    if (!input || !button) return;

    setIcon(button, 'external-link');
    const sync = (): void => {
        button.disabled = !input.value.trim();
        button.toggleClass('is-disabled', button.disabled);
    };

    input.addEventListener('input', sync);
    button.addEventListener('click', () => {
        const url = normalizeUrl(input.value);
        if (!url) {
            new Notice(t('editUrl'));
            return;
        }
        window.open(url, '_blank', 'noopener');
    });

    sync();
}
