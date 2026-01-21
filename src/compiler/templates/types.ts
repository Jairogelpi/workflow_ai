
/**
 * Generic interface for Manifest Templates.
 * A template transforms structured data into a string representation (Assertion/Receipt).
 */
export interface ManifestTemplate<TData> {
    name: string;
    render(data: TData): string;
}

/**
 * Common metadata for all templates.
 */
export interface BaseTemplateData {
    title: string;
    description?: string;
}
