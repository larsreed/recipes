import { fetchMediaBytes } from '../../api/recipesApi';

export type DocxImageType = 'jpg' | 'png' | 'gif' | 'bmp';

export interface DocxImage {
    data: Uint8Array;
    type: DocxImageType;
    width: number;
    height: number;
}

const toDocxImageType = (imageFileName: string): DocxImageType | null => {
    const extension = imageFileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'jpg';
        case 'png':
        case 'gif':
        case 'bmp':
            return extension;
        default:
            return null;
    }
};

export const scaleToFit = (natural: { width: number; height: number }, maxWidth: number, maxHeight: number) => {
    if (!natural.width || !natural.height) return { width: maxWidth, height: maxHeight };
    const ratio = Math.min(maxWidth / natural.width, maxHeight / natural.height, 1);
    return {
        width: Math.max(1, Math.round(natural.width * ratio)),
        height: Math.max(1, Math.round(natural.height * ratio)),
    };
};

const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to decode image'));
    el.src = url;
});

// Re-encode via canvas so EXIF-rotated JPEGs end up baked at their displayed orientation.
// Word ignores EXIF orientation; the browser applies it when loading into an Image element.
const normalizeImage = async (data: Uint8Array, inputType: DocxImageType): Promise<DocxImage> => {
    const inputMime = inputType === 'jpg' ? 'image/jpeg' : `image/${inputType}`;
    const url = URL.createObjectURL(new Blob([data], { type: inputMime }));
    try {
        const img = await loadImage(url);
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        ctx.drawImage(img, 0, 0, width, height);

        const outputType: 'jpg' | 'png' = inputType === 'jpg' ? 'jpg' : 'png';
        const outputMime = outputType === 'jpg' ? 'image/jpeg' : 'image/png';
        const outputBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
                outputMime,
                outputType === 'jpg' ? 0.92 : undefined
            );
        });
        return { data: new Uint8Array(await outputBlob.arrayBuffer()), type: outputType, width, height };
    } finally {
        URL.revokeObjectURL(url);
    }
};

// Returns null when there is no image, the type is unsupported, or loading fails.
export const fetchMediaImage = async (imageFileName?: string): Promise<DocxImage | null> => {
    if (!imageFileName) return null;
    const imageType = toDocxImageType(imageFileName);
    if (!imageType) return null;
    try {
        return await normalizeImage(new Uint8Array(await fetchMediaBytes(imageFileName)), imageType);
    } catch {
        return null;
    }
};
