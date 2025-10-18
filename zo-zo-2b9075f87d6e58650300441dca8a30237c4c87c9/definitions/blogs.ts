export interface Blog {
  excerpt: string;
  url_slug: string;
  cover_image: string;
  custom_cover: string;
  time_create: string;
  key: string;
  author: string;
  title: string;
  content: string;
  tags: { id: number; name: string }[];
}
