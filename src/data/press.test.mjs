import assert from 'node:assert/strict';
import { test } from 'node:test';
import { featuredPress, filterPress, pressFilters, pressItems, sortedPress } from './press.js';

test('the supplied press inventory has six featured items and verified URLs', () => {
  assert.equal(pressItems.length, 17);
  assert.equal(new Set(pressItems.map(item => item.id)).size, 17);
  assert.deepEqual(featuredPress.map(item => item.id), [
    'chitralekha', 'ahmedabad-mirror', 'india-west', 'voyage-la', 'shoutout-la', 'business-standard',
  ]);
  assert.deepEqual(pressItems.filter(item => item.url).map(item => item.url), [
    'https://www.ahmedabadmirror.com/rythum-shastri-the-new-youth-icon-redefining-live-college-concerts/81908473.html',
    'https://indiawest.com/socal-singer-rythum-shastris-star-is-rising/',
    'https://voyagela.com/interview/conversations-with-rythum-shastri',
    'https://shoutoutla.com/meet-rythum-shastri/',
    'https://www.business-standard.com/content/press-releases-ani/harmony-across-horizons-rythum-shastri-s-musical-odyssey-in-america-124051100430_1.html',
    'https://www.timebulletin.com/rythum-shastri-and-navdeep-wadalis-live-sufi-concert-creates-history-in-hollywood/',
    'https://edtimes.in/nj-wealths-song-atmanirbhar-bharat-featuring-rythum-shastri-crosses-100000-views-on-youtube/',
    'https://bollywoodmascot.com/lifestyle/rythum-shastri-brings-a-conceptual-live-music-concert-celebrating-100-years-of-bollywood-cinema/',
    'https://indianbusinesstimes.com/2024/07/31/rythum-shastri-inspires-the-audience-with-his-performance-at-pratham-concert-los-angeles-chapter/',
    'https://theindianeye.com/2023/10/03/gujarati-society-of-southern-california-hosts-garba-in-los-angeles/',
    'https://usinsider.com/rythum-shastri-shines-at-pratham-concert-in/',
    'https://lawire.com/rythum-shastri-mesmerizes-audience-at-navsari-reunion-in-dallas/',
    'https://reflections.live/articles/58/the-melodious-merging-indian-music-takes-root-in-america-15596-lw4is6by.html',
    'https://asiannews.in/rythum-shastris-soor-shakti-catches-attention-in-the-united-states/',
    'https://businessupturn.com/entertainment/music/rythum-shastri-represents-indian-music-at-dallas-reunion-event/',
    'https://filmycharcha.com/bollywood/music/rythum-shastris-cultural-album-soor-shakti-resonates-across-the-u-s',
  ]);
  for (const item of pressItems) {
    assert.ok(Boolean(item.url) !== Boolean(item.badge), item.id);
    assert.ok(item.headline && item.summary && item.dateLabel, item.id);
    if (!item.date) assert.equal(item.dateLabel, 'Date to be confirmed');
  }
  assert.equal(pressItems[0].badge, 'Print Feature');
});

test('filters preserve newest-first order and do not turn unverified features into print stories', () => {
  assert.deepEqual(pressFilters, ['All', 'Interviews', 'Features', 'Concert Coverage', 'Print']);
  assert.deepEqual(pressFilters.map(filter => filterPress(filter).length), [17, 2, 7, 7, 1]);
  assert.deepEqual(filterPress('Print').map(item => item.id), ['chitralekha']);
  assert.deepEqual(sortedPress.map(item => item.id), [
    'ahmedabad-mirror', 'chitralekha', 'us-insider', 'shoutout-la',
    'indian-business-times', 'india-west', 'bollywood-mascot', 'time-bulletin', 'ed-times',
    'business-standard', 'voyage-la', 'la-wire', 'the-indian-eye', 'reflections-live',
    'asian-news', 'business-upturn', 'filmy-charcha',
  ]);
  assert.equal(pressItems.find(item => item.id === 'voyage-la').date, '2024');
  assert.equal(pressItems.find(item => item.id === 'shoutout-la').date, '2024-08');
  assert.equal(pressItems.filter(item => item.date === null).length, 4);
});
