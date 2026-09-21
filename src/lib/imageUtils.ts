/**
 * Utility to compress images on the client side before uploading or saving to localStorage.
 * Resizes large camera photos to a web-optimized resolution (max 1600px, JPEG ~82% quality)
 * to keep sizes around 150KB - 350KB while retaining high clarity for reading scale meters and crane numbers.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<{ url: string; name: string }> {
  return new Promise((resolve) => {
    // If not an image, return raw base64 or fallback
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ url: e.target?.result as string, name: file.name });
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      resolve({ url: '', name: file.name });
    };
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        resolve({ url: dataUrl, name: file.name });
      };
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ url: dataUrl, name: file.name });
          return;
        }

        // Fill background white in case of PNG transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ url: compressedDataUrl, name: file.name });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
