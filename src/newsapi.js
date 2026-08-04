// NewsAPI Integration Service for Live Stock & Financial Market News

/**
 * Fetch live stock market news for a ticker or keyword using NewsAPI
 * https://newsapi.org
 */
export async function fetchNewsApiHeadlines(query, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('No NewsAPI Key configured');
  }

  const searchTerm = encodeURIComponent(`${query} stock market OR earnings OR finance`);
  const url = `https://newsapi.org/v2/everything?q=${searchTerm}&sortBy=publishedAt&pageSize=6&language=en&apiKey=${apiKey.trim()}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || `NewsAPI returned status ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== 'ok') {
    throw new Error(data.message || 'NewsAPI request error');
  }

  return (data.articles || []).map(article => {
    const titleLower = (article.title || '').toLowerCase();
    let sentiment = 'Neutral';
    if (titleLower.includes('surge') || titleLower.includes('jump') || titleLower.includes('rally') || titleLower.includes('beat') || titleLower.includes('growth') || titleLower.includes('high')) {
      sentiment = 'Bullish';
    } else if (titleLower.includes('drop') || titleLower.includes('fall') || titleLower.includes('decline') || titleLower.includes('slump') || titleLower.includes('risk') || titleLower.includes('loss')) {
      sentiment = 'Bearish';
    }

    return {
      title: article.title || 'Market News Update',
      description: article.description || article.content || 'Latest financial update for ' + query,
      source: article.source?.name || 'Financial Wire',
      url: article.url || '#',
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      sentiment
    };
  });
}
