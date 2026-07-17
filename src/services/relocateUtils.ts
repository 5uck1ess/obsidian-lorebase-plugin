/**
 * Map a note path to its destination while preserving the path relative to
 * its old library folder. An empty folder path represents the vault root.
 */
export function relocatedPath(filePath: string, oldFolder: string, newFolder: string): string {
    const prefix = oldFolder ? `${oldFolder}/` : '';
    const relative = prefix && filePath.startsWith(prefix)
        ? filePath.slice(prefix.length)
        : (filePath.split('/').pop() ?? filePath);
    return newFolder ? `${newFolder}/${relative}` : relative;
}

/** Add a numeric suffix before .md until a free vault path is found. */
export function uniqueVaultPath(desiredPath: string, exists: (path: string) => boolean): string {
    if (!exists(desiredPath)) return desiredPath;

    const base = desiredPath.endsWith('.md') ? desiredPath.slice(0, -3) : desiredPath;
    let suffix = 2;
    let candidate = `${base} ${suffix}.md`;
    while (exists(candidate)) {
        suffix++;
        candidate = `${base} ${suffix}.md`;
    }
    return candidate;
}
