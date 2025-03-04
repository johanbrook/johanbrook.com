const _WISHLIST_PATH = 'src/_data/toread.yml';

export interface WishListBook {
    title: string;
    slug: string;
    author: string;
    addedAt: Date;
    notes?: string;
}
