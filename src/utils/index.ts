


export function createPageUrl(pageName: string) {
    // Convert PascalCase/camelCase (and mixed alphanumerics like "Setup2FA") to kebab-case paths
    const toKebabCase = (value: string) =>
        value
            // Split lower-or-digit followed by upper (e.g., AlgorithmAI -> Algorithm-AI)
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            // Split acronym run followed by Capital+lower/digit (e.g., JSONViewer -> JSON-Viewer)
            .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1-$2')
            // Insert hyphen between letter and number (e.g., Setup2FA -> Setup-2FA)
            .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
            // Normalize non-alphanumerics to hyphens
            .replace(/[^a-zA-Z0-9]+/g, '-')
            // Collapse multiple hyphens
            .replace(/-+/g, '-')
            .toLowerCase()
            // Remove hyphen between number and following letters (2-fa -> 2fa)
            .replace(/([0-9])-(?=[a-z])/g, '$1')
            // Trim leading/trailing hyphens
            .replace(/^-+|-+$/g, '');

    return '/' + toKebabCase(pageName);
}