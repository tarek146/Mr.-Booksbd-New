import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dedupeById,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  isDirectVideoUrl,
  searchProductsForReel
} from './videoReelHelpers';
import { Product } from '../types';

test('dedupeById removes duplicates and preserves unique order', () => {
  const items = [
    { id: 'reel-1', title: 'First' },
    { id: 'reel-2', title: 'Second' },
    { id: 'reel-1', title: 'First Duplicate' },
    { id: 'reel-3', title: 'Third' },
    { id: 'reel-2', title: 'Second Duplicate' }
  ];

  const deduped = dedupeById(items);
  assert.equal(deduped.length, 3);
  assert.deepEqual(deduped.map(d => d.id), ['reel-1', 'reel-2', 'reel-3']);
  assert.equal(deduped[0].title, 'First');
});

test('extractYouTubeVideoId correctly extracts IDs from YouTube Shorts and standard links', () => {
  // YouTube Shorts
  const shortsUrl = 'https://www.youtube.com/shorts/dQw4w9WgXcQ?si=abcdef';
  assert.equal(extractYouTubeVideoId(shortsUrl), 'dQw4w9WgXcQ');

  // youtu.be shortlink
  const youtuBeUrl = 'https://youtu.be/dQw4w9WgXcQ';
  assert.equal(extractYouTubeVideoId(youtuBeUrl), 'dQw4w9WgXcQ');

  // Standard watch URL
  const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s';
  assert.equal(extractYouTubeVideoId(watchUrl), 'dQw4w9WgXcQ');

  // Invalid or direct MP4 URL
  assert.equal(extractYouTubeVideoId('https://example.com/video.mp4'), null);
  assert.equal(extractYouTubeVideoId(''), null);
});

test('getYouTubeThumbnailUrl generates valid high-quality thumbnail image URL', () => {
  const videoId = 'dQw4w9WgXcQ';
  assert.equal(
    getYouTubeThumbnailUrl(videoId),
    'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
  );
  assert.equal(getYouTubeThumbnailUrl(''), '');
});

test('isDirectVideoUrl detects MP4, WebM, and storage video URLs', () => {
  assert.equal(isDirectVideoUrl('https://example.com/demo.mp4'), true);
  assert.equal(isDirectVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-test.mp4'), true);
  assert.equal(isDirectVideoUrl('https://firebasestorage.googleapis.com/v0/b/app/video?alt=media'), true);
  assert.equal(isDirectVideoUrl('https://example.com/photo.jpg'), false);
  assert.equal(isDirectVideoUrl('https://youtube.com/shorts/12345'), false);
});

test('searchProductsForReel filters products by title, author, category and SKU', () => {
  const sampleProducts: Product[] = [
    {
      id: 'p1',
      title: 'প্যারাডক্সিক্যাল সাজিদ ২',
      slug: 'paradoxical-sajid-2',
      description: 'জনপ্রিয় ইসলামিক বই',
      rating: 4.9,
      reviewCount: 120,
      createdAt: 1735689600000,
      author: 'আরিফ আজাদ',
      category: 'Islamic Books',
      price: 350,
      stock: 50,
      sku: 'MRB-BK-1001',
      type: 'book',
      images: ['https://example.com/img1.jpg'],
      variants: []
    },
    {
      id: 'p2',
      title: 'হিমু সমগ্র ১',
      slug: 'himu-somogro-1',
      description: 'হিমু সিরিজের বই',
      rating: 4.8,
      reviewCount: 95,
      createdAt: 1735689600000,
      author: 'হুমায়ূন আহমেদ',
      category: 'Bangla Novels',
      price: 650,
      stock: 30,
      sku: 'MRB-BK-1002',
      type: 'book',
      images: ['https://example.com/img2.jpg'],
      variants: []
    },
    {
      id: 'p3',
      title: 'Fountain Pen & Calligraphy Gift Set',
      slug: 'fountain-pen-set',
      description: 'প্রিমিয়াম ক্যালিগ্রাফি কলম সেট',
      rating: 4.7,
      reviewCount: 42,
      createdAt: 1735689600000,
      author: 'Stationery Brand',
      category: 'Pens & Calligraphy',
      price: 850,
      stock: 20,
      sku: 'ST-PEN-SET',
      type: 'stationery',
      images: ['https://example.com/img3.jpg'],
      variants: []
    }
  ];

  // Search by Bengali title
  const res1 = searchProductsForReel(sampleProducts, 'সাজিদ');
  assert.equal(res1.length, 1);
  assert.equal(res1[0].id, 'p1');

  // Search by author
  const res2 = searchProductsForReel(sampleProducts, 'হুমায়ূন');
  assert.equal(res2.length, 1);
  assert.equal(res2[0].id, 'p2');

  // Search by English category or SKU
  const res3 = searchProductsForReel(sampleProducts, 'PEN');
  assert.equal(res3.length, 1);
  assert.equal(res3[0].id, 'p3');

  // Empty query returns all products
  assert.equal(searchProductsForReel(sampleProducts, '').length, 3);
});
