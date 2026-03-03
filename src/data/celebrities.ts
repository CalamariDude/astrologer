export interface Celebrity {
  name: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM (24h)
  location: string;    // "City, Country"
  lat: number;
  lng: number;
  category: CelebrityCategory;
}

export type CelebrityCategory =
  | 'Actors' | 'Musicians' | 'Athletes' | 'Leaders'
  | 'Scientists' | 'Artists' | 'Writers' | 'Historical';

export const CELEBRITY_CATEGORIES: CelebrityCategory[] = [
  'Actors', 'Musicians', 'Athletes', 'Leaders',
  'Scientists', 'Artists', 'Writers', 'Historical',
];

export const CELEBRITIES: Celebrity[] = [
  // ─── Actors ────────────────────────────────────────────
  { name: 'Leonardo DiCaprio', date: '1974-11-11', time: '02:47', location: 'Los Angeles, CA', lat: 34.05, lng: -118.24, category: 'Actors' },
  { name: 'Angelina Jolie', date: '1975-06-04', time: '09:09', location: 'Los Angeles, CA', lat: 34.05, lng: -118.24, category: 'Actors' },
  { name: 'Brad Pitt', date: '1963-12-18', time: '06:31', location: 'Shawnee, OK', lat: 35.33, lng: -96.93, category: 'Actors' },
  { name: 'Meryl Streep', date: '1949-06-22', time: '08:05', location: 'Summit, NJ', lat: 40.72, lng: -74.36, category: 'Actors' },
  { name: 'Johnny Depp', date: '1963-06-09', time: '08:44', location: 'Owensboro, KY', lat: 37.77, lng: -87.11, category: 'Actors' },
  { name: 'Marilyn Monroe', date: '1926-06-01', time: '09:30', location: 'Los Angeles, CA', lat: 34.05, lng: -118.24, category: 'Actors' },
  { name: 'Robert De Niro', date: '1943-08-17', time: '03:00', location: 'New York, NY', lat: 40.71, lng: -74.01, category: 'Actors' },
  { name: 'Nicole Kidman', date: '1967-06-20', time: '15:15', location: 'Honolulu, HI', lat: 21.31, lng: -157.86, category: 'Actors' },
  { name: 'Tom Hanks', date: '1956-07-09', time: '11:17', location: 'Concord, CA', lat: 37.98, lng: -122.03, category: 'Actors' },
  { name: 'Scarlett Johansson', date: '1984-11-22', time: '07:00', location: 'New York, NY', lat: 40.71, lng: -74.01, category: 'Actors' },

  // ─── Musicians ─────────────────────────────────────────
  { name: 'Beyonce', date: '1981-09-04', time: '10:00', location: 'Houston, TX', lat: 29.76, lng: -95.37, category: 'Musicians' },
  { name: 'Prince', date: '1958-06-07', time: '18:17', location: 'Minneapolis, MN', lat: 44.98, lng: -93.27, category: 'Musicians' },
  { name: 'David Bowie', date: '1947-01-08', time: '09:00', location: 'London, UK', lat: 51.51, lng: -0.13, category: 'Musicians' },
  { name: 'Madonna', date: '1958-08-16', time: '07:05', location: 'Bay City, MI', lat: 43.59, lng: -83.89, category: 'Musicians' },
  { name: 'Freddie Mercury', date: '1946-09-05', time: '06:00', location: 'Stone Town, Zanzibar', lat: -6.16, lng: 39.19, category: 'Musicians' },
  { name: 'Lady Gaga', date: '1986-03-28', time: '09:53', location: 'New York, NY', lat: 40.71, lng: -74.01, category: 'Musicians' },
  { name: 'Jimi Hendrix', date: '1942-11-27', time: '10:15', location: 'Seattle, WA', lat: 47.61, lng: -122.33, category: 'Musicians' },
  { name: 'Whitney Houston', date: '1963-08-09', time: '20:55', location: 'Newark, NJ', lat: 40.74, lng: -74.17, category: 'Musicians' },
  { name: 'John Lennon', date: '1940-10-09', time: '18:30', location: 'Liverpool, UK', lat: 53.41, lng: -2.98, category: 'Musicians' },
  { name: 'Elvis Presley', date: '1935-01-08', time: '04:35', location: 'Tupelo, MS', lat: 34.26, lng: -88.70, category: 'Musicians' },

  // ─── Athletes ──────────────────────────────────────────
  { name: 'Michael Jordan', date: '1963-02-17', time: '13:40', location: 'Brooklyn, NY', lat: 40.68, lng: -73.94, category: 'Athletes' },
  { name: 'Serena Williams', date: '1981-09-26', time: '20:28', location: 'Saginaw, MI', lat: 43.42, lng: -83.95, category: 'Athletes' },
  { name: 'Muhammad Ali', date: '1942-01-17', time: '18:35', location: 'Louisville, KY', lat: 38.25, lng: -85.76, category: 'Athletes' },
  { name: 'Lionel Messi', date: '1987-06-24', time: '06:00', location: 'Rosario, Argentina', lat: -32.95, lng: -60.65, category: 'Athletes' },
  { name: 'Cristiano Ronaldo', date: '1985-02-05', time: '05:25', location: 'Funchal, Portugal', lat: 32.65, lng: -16.91, category: 'Athletes' },
  { name: 'LeBron James', date: '1984-12-30', time: '16:04', location: 'Akron, OH', lat: 41.08, lng: -81.52, category: 'Athletes' },
  { name: 'Tiger Woods', date: '1975-12-30', time: '22:50', location: 'Cypress, CA', lat: 33.82, lng: -118.04, category: 'Athletes' },
  { name: 'Usain Bolt', date: '1986-08-21', time: '14:00', location: 'Sherwood Content, Jamaica', lat: 18.35, lng: -77.57, category: 'Athletes' },
  { name: 'Tom Brady', date: '1977-08-03', time: '11:48', location: 'San Mateo, CA', lat: 37.56, lng: -122.32, category: 'Athletes' },
  { name: 'Michael Phelps', date: '1985-06-30', time: '07:30', location: 'Baltimore, MD', lat: 39.29, lng: -76.61, category: 'Athletes' },

  // ─── Leaders ───────────────────────────────────────────
  { name: 'Barack Obama', date: '1961-08-04', time: '19:24', location: 'Honolulu, HI', lat: 21.31, lng: -157.86, category: 'Leaders' },
  { name: 'Queen Elizabeth II', date: '1926-04-21', time: '02:40', location: 'London, UK', lat: 51.51, lng: -0.13, category: 'Leaders' },
  { name: 'John F. Kennedy', date: '1917-05-29', time: '15:00', location: 'Brookline, MA', lat: 42.33, lng: -71.12, category: 'Leaders' },
  { name: 'Mahatma Gandhi', date: '1869-10-02', time: '07:12', location: 'Porbandar, India', lat: 21.64, lng: 69.60, category: 'Leaders' },
  { name: 'Nelson Mandela', date: '1918-07-18', time: '14:54', location: 'Mvezo, South Africa', lat: -31.97, lng: 28.68, category: 'Leaders' },
  { name: 'Martin Luther King Jr.', date: '1929-01-15', time: '12:00', location: 'Atlanta, GA', lat: 33.75, lng: -84.39, category: 'Leaders' },
  { name: 'Winston Churchill', date: '1874-11-30', time: '01:30', location: 'Woodstock, UK', lat: 51.85, lng: -1.35, category: 'Leaders' },
  { name: 'Abraham Lincoln', date: '1809-02-12', time: '06:54', location: 'Hodgenville, KY', lat: 37.57, lng: -85.74, category: 'Leaders' },
  { name: 'Angela Merkel', date: '1954-07-17', time: '18:00', location: 'Hamburg, Germany', lat: 53.55, lng: 9.99, category: 'Leaders' },
  { name: 'Princess Diana', date: '1961-07-01', time: '19:45', location: 'Sandringham, UK', lat: 52.83, lng: 0.51, category: 'Leaders' },

  // ─── Scientists ────────────────────────────────────────
  { name: 'Albert Einstein', date: '1879-03-14', time: '11:30', location: 'Ulm, Germany', lat: 48.40, lng: 9.99, category: 'Scientists' },
  { name: 'Nikola Tesla', date: '1856-07-10', time: '00:00', location: 'Smiljan, Croatia', lat: 44.57, lng: 15.32, category: 'Scientists' },
  { name: 'Marie Curie', date: '1867-11-07', time: '12:00', location: 'Warsaw, Poland', lat: 52.23, lng: 21.01, category: 'Scientists' },
  { name: 'Isaac Newton', date: '1643-01-04', time: '01:38', location: 'Woolsthorpe, UK', lat: 52.81, lng: -0.51, category: 'Scientists' },
  { name: 'Stephen Hawking', date: '1942-01-08', time: '08:18', location: 'Oxford, UK', lat: 51.75, lng: -1.25, category: 'Scientists' },
  { name: 'Carl Sagan', date: '1934-11-09', time: '17:05', location: 'Brooklyn, NY', lat: 40.68, lng: -73.94, category: 'Scientists' },
  { name: 'Charles Darwin', date: '1809-02-12', time: '03:00', location: 'Shrewsbury, UK', lat: 52.71, lng: -2.75, category: 'Scientists' },
  { name: 'Galileo Galilei', date: '1564-02-15', time: '15:40', location: 'Pisa, Italy', lat: 43.72, lng: 10.40, category: 'Scientists' },
  { name: 'Carl Jung', date: '1875-07-26', time: '19:29', location: 'Kesswil, Switzerland', lat: 47.60, lng: 9.32, category: 'Scientists' },
  { name: 'Sigmund Freud', date: '1856-05-06', time: '18:30', location: 'Freiberg, Czech Republic', lat: 49.63, lng: 18.35, category: 'Scientists' },

  // ─── Artists ───────────────────────────────────────────
  { name: 'Pablo Picasso', date: '1881-10-25', time: '23:15', location: 'Malaga, Spain', lat: 36.72, lng: -4.42, category: 'Artists' },
  { name: 'Frida Kahlo', date: '1907-07-06', time: '08:30', location: 'Mexico City, Mexico', lat: 19.43, lng: -99.13, category: 'Artists' },
  { name: 'Leonardo da Vinci', date: '1452-04-15', time: '21:40', location: 'Vinci, Italy', lat: 43.79, lng: 10.92, category: 'Artists' },
  { name: 'Vincent van Gogh', date: '1853-03-30', time: '11:00', location: 'Zundert, Netherlands', lat: 51.47, lng: 4.66, category: 'Artists' },
  { name: 'Salvador Dali', date: '1904-05-11', time: '08:45', location: 'Figueres, Spain', lat: 42.27, lng: 2.96, category: 'Artists' },
  { name: 'Michelangelo', date: '1475-03-06', time: '01:45', location: 'Caprese, Italy', lat: 43.64, lng: 11.99, category: 'Artists' },
  { name: 'Andy Warhol', date: '1928-08-06', time: '06:30', location: 'Pittsburgh, PA', lat: 40.44, lng: -79.99, category: 'Artists' },
  { name: 'Claude Monet', date: '1840-11-14', time: '03:00', location: 'Paris, France', lat: 48.86, lng: 2.35, category: 'Artists' },
  { name: 'Georgia O\'Keeffe', date: '1887-11-15', time: '09:00', location: 'Sun Prairie, WI', lat: 43.18, lng: -89.21, category: 'Artists' },
  { name: 'Rembrandt', date: '1606-07-15', time: '11:00', location: 'Leiden, Netherlands', lat: 52.16, lng: 4.49, category: 'Artists' },

  // ─── Writers ───────────────────────────────────────────
  { name: 'William Shakespeare', date: '1564-04-23', time: '11:00', location: 'Stratford-upon-Avon, UK', lat: 52.19, lng: -1.71, category: 'Writers' },
  { name: 'Virginia Woolf', date: '1882-01-25', time: '12:15', location: 'London, UK', lat: 51.51, lng: -0.13, category: 'Writers' },
  { name: 'Ernest Hemingway', date: '1899-07-21', time: '08:00', location: 'Oak Park, IL', lat: 41.89, lng: -87.78, category: 'Writers' },
  { name: 'Edgar Allan Poe', date: '1809-01-19', time: '01:00', location: 'Boston, MA', lat: 42.36, lng: -71.06, category: 'Writers' },
  { name: 'Oscar Wilde', date: '1854-10-16', time: '03:00', location: 'Dublin, Ireland', lat: 53.35, lng: -6.26, category: 'Writers' },
  { name: 'Sylvia Plath', date: '1932-10-27', time: '14:10', location: 'Boston, MA', lat: 42.36, lng: -71.06, category: 'Writers' },
  { name: 'Mark Twain', date: '1835-11-30', time: '06:22', location: 'Florida, MO', lat: 39.50, lng: -91.58, category: 'Writers' },
  { name: 'Jane Austen', date: '1775-12-16', time: '23:45', location: 'Steventon, UK', lat: 51.25, lng: -1.20, category: 'Writers' },
  { name: 'Franz Kafka', date: '1883-07-03', time: '07:00', location: 'Prague, Czech Republic', lat: 50.08, lng: 14.44, category: 'Writers' },
  { name: 'Fyodor Dostoevsky', date: '1821-11-11', time: '05:00', location: 'Moscow, Russia', lat: 55.76, lng: 37.62, category: 'Writers' },

  // ─── Historical ────────────────────────────────────────
  { name: 'Napoleon Bonaparte', date: '1769-08-15', time: '11:30', location: 'Ajaccio, Corsica', lat: 41.92, lng: 8.74, category: 'Historical' },
  { name: 'Cleopatra', date: '-0068-01-01', time: '12:00', location: 'Alexandria, Egypt', lat: 31.20, lng: 29.92, category: 'Historical' },
  { name: 'Julius Caesar', date: '-0099-07-12', time: '12:00', location: 'Rome, Italy', lat: 41.90, lng: 12.50, category: 'Historical' },
  { name: 'Alexander the Great', date: '-0355-07-20', time: '12:00', location: 'Pella, Greece', lat: 40.76, lng: 22.52, category: 'Historical' },
  { name: 'Genghis Khan', date: '1162-05-31', time: '12:00', location: 'Khentii, Mongolia', lat: 48.66, lng: 109.17, category: 'Historical' },
  { name: 'Nostradamus', date: '1503-12-14', time: '12:00', location: 'Saint-Remy, France', lat: 43.79, lng: 4.83, category: 'Historical' },
  { name: 'Benjamin Franklin', date: '1706-01-17', time: '10:30', location: 'Boston, MA', lat: 42.36, lng: -71.06, category: 'Historical' },
  { name: 'Marie Antoinette', date: '1755-11-02', time: '19:30', location: 'Vienna, Austria', lat: 48.21, lng: 16.37, category: 'Historical' },
  { name: 'Nikola Tesla', date: '1856-07-10', time: '00:00', location: 'Smiljan, Croatia', lat: 44.57, lng: 15.32, category: 'Historical' },
  { name: 'Coco Chanel', date: '1883-08-19', time: '16:00', location: 'Saumur, France', lat: 47.26, lng: -0.08, category: 'Historical' },
];
