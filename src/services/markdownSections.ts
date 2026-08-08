const MY_NOTES_HEADING = 'My Notes';

export function extractMarkdownSection(content: string, heading: string = MY_NOTES_HEADING): string {
    const escaped = escapeRegExp(heading);
    const startPattern = new RegExp(`^##\\s+${escaped}\\s*$`, 'im');
    const start = content.match(startPattern);
    if (!start || start.index === undefined) return '';
    const bodyStart = start.index + start[0].length;
    const rest = content.slice(bodyStart);
    const next = rest.search(/^##\s+/im);
    const body = next >= 0 ? rest.slice(0, next) : rest;
    return body.replace(/^\s*\n/, '').replace(/\s+$/, '');
}

export function upsertMarkdownSection(content: string, heading: string = MY_NOTES_HEADING, value: string): string {
    const escaped = escapeRegExp(heading);
    const startPattern = new RegExp(`^##\\s+${escaped}\\s*$`, 'im');
    const start = content.match(startPattern);
    const normalized = value.trim();
    const sectionText = normalized ? `## ${heading}\n\n${normalized}` : '';

    if (!start || start.index === undefined) {
        return sectionText ? `${trimEnd(content)}\n\n${sectionText}\n` : content;
    }

    const sectionStart = start.index;
    const bodyStart = start.index + start[0].length;
    const rest = content.slice(bodyStart);
    const next = rest.search(/^##\s+/im);
    const sectionEnd = next >= 0 ? bodyStart + next : content.length;
    const before = trimEnd(content.slice(0, sectionStart));
    const after = content.slice(sectionEnd).replace(/^\s*\n/, '');

    if (!sectionText) {
        return `${before}${after ? `\n\n${trimStart(after)}` : ''}`;
    }

    return after
        ? `${before}\n\n${sectionText}\n${after}`.replace(/\n{4,}/g, '\n\n\n')
        : `${before}\n\n${sectionText}\n`;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function trimEnd(value: string): string {
    return value.replace(/\s+$/, '');
}

function trimStart(value: string): string {
    return value.replace(/^\s+/, '');
}
