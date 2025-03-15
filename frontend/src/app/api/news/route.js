import Parser from 'rss-parser';
import { NextResponse } from 'next/server';

const RSS_FEEDS = [
  'https://www.housingwire.com/feed/',
  'https://www.bankrate.com/feed/',
  'https://www.nerdwallet.com/blog/feed/',
];

export async function GET() {
  try {
    const parser = new Parser();
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const feedData = await parser.parseURL(feed);
        return feedData.items.map(item => ({
          title: item.title,
          description: item.contentSnippet || item.content,
          link: item.link,
          pub_date: item.pubDate,
          source: feedData.title,
        }));
      } catch (error) {
        console.error(`Error parsing feed ${feed}:`, error);
        return [];
      }
    });

    const allFeeds = await Promise.all(feedPromises);
    const news = allFeeds.flat().sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date));

    return NextResponse.json({ news });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
