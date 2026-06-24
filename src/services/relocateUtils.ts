/**
 * Map a note's path to its destination under newFolder, preserving the note's
 * path relative to oldFolder. An empty folder string means the vault root.
 * Pure — no Obsidian runtime deps.
 */
export function relocatedPath(filePath: string, oldFolder: string, newFolder: string): string {
    const prefix = oldFolder ? `${oldFolder}/` : '';
    const relative = prefix && filePath.startsWith(prefix)
        ? filePath.slice(prefix.length)
        : (filePath.split('/').pop() ?? filePath);
    return newFolder ? `${newFolder}/${relative}` : relative;
}

/**
 * Return desiredPath if free; otherwise insert " 2", " 3", ... before the .md
 * extension until exists() returns false. `exists` reports whether a path is
 * already taken (in the vault or already claimed in this batch).
 */
export function uniqueVaultPath(desiredPath: string, exists: (path: string) => boolean): string {
    if (!exists(desiredPath)) {
        return desiredPath;
    }
    const base = desiredPath.endsWith('.md') ? desiredPath.slice(0, -3) : desiredPath;
    let suffix = 2;
    let candidate = `${base} ${suffix}.md`;
    while (exists(candidate)) {
        suffix++;
        candidate = `${base} ${suffix}.md`;
    }
    return candidate;
}
