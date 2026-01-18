/**
 * Avatar utility functions
 */

/**
 * Generate a default avatar based on username
 * Uses DiceBear Avatars API with initials style
 */
export const generateDefaultAvatar = (username: string): string => {
  // Use DiceBear Avatars API with initials style
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=4f46e5&textColor=ffffff&fontSize=40`;
};

/**
 * Get user avatar URL - returns custom avatar if available, otherwise generates default
 */
export const getUserAvatar = (user: { username: string; avatarUrl?: string }): string => {
  if (user.avatarUrl && user.avatarUrl.trim() !== '') {
    return user.avatarUrl;
  }
  return generateDefaultAvatar(user.username);
};

/**
 * Validate avatar URL
 */
export const isValidAvatarUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    // Allow common image hosting services and DiceBear
    const allowedDomains = [
      'api.dicebear.com',
      'avatars.githubusercontent.com',
      'gravatar.com',
      'i.imgur.com',
      'images.unsplash.com',
      'picsum.photos',
      'cloudinary.com',
      'res.cloudinary.com',
    ];
    
    return allowedDomains.some(domain => parsedUrl.hostname.includes(domain));
  } catch {
    return false;
  }
};

/**
 * Extract filename from URL
 */
export const getFilenameFromUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    return pathname.substring(pathname.lastIndexOf('/') + 1);
  } catch {
    return 'avatar';
  }
};