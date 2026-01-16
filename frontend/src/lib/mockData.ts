// Mock data for demonstration purposes

export const dashboardMetrics = {
    totalStreams: 1234567,
    streamsChange: 12.5,
    revenue: 12345.67,
    revenueChange: 8.2,
    activeReleases: 45,
    pendingReleases: 2,
    monthlyListeners: 456789,
    listenersChange: 15.3,
};

export const streamingData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    streams: Math.floor(30000 + Math.random() * 20000 + i * 500),
}));

export const topReleases = [
    {
        id: '1',
        title: 'Summer Vibes',
        artist: 'DJ Sunshine',
        artwork: '/artwork1.jpg',
        streams: 456789,
        revenue: 2345.67,
        change: 23.4,
    },
    {
        id: '2',
        title: 'Midnight Dreams',
        artist: 'Luna Belle',
        artwork: '/artwork2.jpg',
        streams: 389456,
        revenue: 1987.23,
        change: 18.9,
    },
    {
        id: '3',
        title: 'Urban Legends',
        artist: 'The Beats Collective',
        artwork: '/artwork3.jpg',
        streams: 312567,
        revenue: 1654.89,
        change: -5.2,
    },
    {
        id: '4',
        title: 'Electric Soul',
        artist: 'Neon Pulse',
        artwork: '/artwork4.jpg',
        streams: 267834,
        revenue: 1423.45,
        change: 12.1,
    },
];

export const topCountries = [
    { country: 'United States', code: 'US', streams: 345678, percentage: 28 },
    { country: 'Brazil', code: 'BR', streams: 234567, percentage: 19 },
    { country: 'United Kingdom', code: 'GB', streams: 198765, percentage: 16 },
    { country: 'Germany', code: 'DE', streams: 167890, percentage: 14 },
    { country: 'France', code: 'FR', streams: 145678, percentage: 12 },
];

export const recentActivity = [
    {
        id: '1',
        type: 'distribution',
        message: 'Summer Vibes distributed to Spotify',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
        id: '2',
        type: 'milestone',
        message: 'Midnight Dreams reached 100K streams',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
        id: '3',
        type: 'revenue',
        message: 'Monthly payout of $5,432.10 processed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
        id: '4',
        type: 'distribution',
        message: 'Urban Legends approved on Apple Music',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
];

export const analyticsMetrics = {
    totalStreams: 2456789,
    uniqueListeners: 567890,
    avgPlayDuration: 187, // seconds
    skipRate: 23.5,
};

export const platformBreakdown = [
    { platform: 'Spotify', streams: 987654, percentage: 40.2, revenue: 5234.56 },
    { platform: 'Apple Music', streams: 654321, percentage: 26.6, revenue: 3456.78 },
    { platform: 'YouTube Music', streams: 456789, percentage: 18.6, revenue: 2345.67 },
    { platform: 'Deezer', streams: 198765, percentage: 8.1, revenue: 1098.76 },
    { platform: 'Amazon Music', streams: 123456, percentage: 5.0, revenue: 876.54 },
    { platform: 'Tidal', streams: 35804, percentage: 1.5, revenue: 543.21 },
];

export const topTracks = [
    {
        id: '1',
        title: 'Summer Vibes',
        artist: 'DJ Sunshine',
        album: 'Summer Collection',
        streams: 456789,
        saves: 12345,
        playlists: 234,
        duration: 215,
    },
    {
        id: '2',
        title: 'Midnight Dreams',
        artist: 'Luna Belle',
        album: 'Nocturnal',
        streams: 389456,
        saves: 10234,
        playlists: 198,
        duration: 198,
    },
    {
        id: '3',
        title: 'City Lights',
        artist: 'The Beats Collective',
        album: 'Urban Legends',
        streams: 312567,
        saves: 8765,
        playlists: 167,
        duration: 203,
    },
    {
        id: '4',
        title: 'Electric Soul',
        artist: 'Neon Pulse',
        album: 'Synth Wave',
        streams: 267834,
        saves: 7654,
        playlists: 145,
        duration: 189,
    },
    {
        id: '5',
        title: 'Ocean Breeze',
        artist: 'DJ Sunshine',
        album: 'Summer Collection',
        streams: 234567,
        saves: 6543,
        playlists: 123,
        duration: 227,
    },
];

export const platforms = [
    { id: 'spotify', name: 'Spotify', logo: '🎵', status: 'active', color: '#1DB954' },
    { id: 'apple', name: 'Apple Music', logo: '🍎', status: 'active', color: '#FA243C' },
    { id: 'youtube', name: 'YouTube Music', logo: '▶️', status: 'active', color: '#FF0000' },
    { id: 'deezer', name: 'Deezer', logo: '🎧', status: 'active', color: '#FF6600' },
    { id: 'amazon', name: 'Amazon Music', logo: '🛒', status: 'active', color: '#FF9900' },
    { id: 'tidal', name: 'Tidal', logo: '🌊', status: 'active', color: '#000000' },
    { id: 'soundcloud', name: 'SoundCloud', logo: '☁️', status: 'inactive', color: '#FF5500' },
    { id: 'pandora', name: 'Pandora', logo: '📻', status: 'inactive', color: '#3668FF' },
];

export const distributionReleases = [
    {
        id: '1',
        title: 'Summer Vibes',
        artist: 'DJ Sunshine',
        releaseDate: '2025-11-15',
        status: {
            spotify: 'live',
            apple: 'live',
            youtube: 'live',
            deezer: 'live',
            amazon: 'live',
            tidal: 'pending',
        },
    },
    {
        id: '2',
        title: 'Midnight Dreams',
        artist: 'Luna Belle',
        releaseDate: '2025-10-20',
        status: {
            spotify: 'live',
            apple: 'live',
            youtube: 'live',
            deezer: 'live',
            amazon: 'live',
            tidal: 'live',
        },
    },
    {
        id: '3',
        title: 'Urban Legends',
        artist: 'The Beats Collective',
        releaseDate: '2025-12-01',
        status: {
            spotify: 'live',
            apple: 'review',
            youtube: 'live',
            deezer: 'pending',
            amazon: 'live',
            tidal: 'rejected',
        },
    },
];

export const distributionTimeline = [
    {
        id: '1',
        release: 'Summer Vibes',
        platform: 'Spotify',
        event: 'Approved and Live',
        date: new Date('2025-11-16T10:30:00'),
    },
    {
        id: '2',
        release: 'Summer Vibes',
        platform: 'Apple Music',
        event: 'Submitted for Review',
        date: new Date('2025-11-15T14:00:00'),
    },
    {
        id: '3',
        release: 'Midnight Dreams',
        platform: 'All Platforms',
        event: 'Distribution Complete',
        date: new Date('2025-10-21T09:15:00'),
    },
    {
        id: '4',
        release: 'Urban Legends',
        platform: 'Tidal',
        event: 'Rejected - Metadata Issue',
        date: new Date('2025-12-02T16:45:00'),
    },
];

export const catalogReleases = [
    {
        id: '1',
        title: 'Summer Vibes',
        artist: 'DJ Sunshine',
        releaseDate: '2025-11-15',
        status: 'live',
        artwork: '/artwork1.jpg',
        upc: '123456789012',
        tracksCount: 12,
        totalStreams: 456789,
        revenue: 2345.67,
        tracks: [
            { id: 't1', title: 'Ocean Breeze', duration: '3:45', isrc: 'US-ABC-25-00001', explicit: false },
            { id: 't2', title: 'Golden Hour', duration: '4:12', isrc: 'US-ABC-25-00002', explicit: false },
            { id: 't3', title: 'Beach Party (Extended)', duration: '6:30', isrc: 'US-ABC-25-00003', explicit: false }
        ]
    },
    {
        id: '2',
        title: 'Midnight Dreams',
        artist: 'Luna Belle',
        releaseDate: '2025-10-20',
        status: 'live',
        artwork: '/artwork2.jpg',
        upc: '123456789013',
        tracksCount: 10,
        totalStreams: 389456,
        revenue: 1987.23,
        tracks: [
            { id: 't4', title: 'Moonlight Shadow', duration: '3:58', isrc: 'US-DEF-25-00101', explicit: false },
            { id: 't5', title: 'Deep Sleep', duration: '5:20', isrc: 'US-DEF-25-00102', explicit: false }
        ]
    },
    {
        id: '3',
        title: 'Urban Legends',
        artist: 'The Beats Collective',
        releaseDate: '2025-12-01',
        status: 'review',
        artwork: '/artwork3.jpg',
        upc: '123456789014',
        tracksCount: 14,
        totalStreams: 312567,
        revenue: 1654.89,
        tracks: [
            { id: 't6', title: 'Concrete Jungle', duration: '4:05', isrc: 'US-GHI-25-00201', explicit: true },
            { id: 't7', title: 'Neon Lights', duration: '3:30', isrc: 'US-GHI-25-00202', explicit: false }
        ]
    },
    {
        id: '4',
        title: 'Electric Soul',
        artist: 'Neon Pulse',
        releaseDate: '2025-09-10',
        status: 'live',
        artwork: '/artwork4.jpg',
        upc: '123456789015',
        tracksCount: 8,
        totalStreams: 267834,
        revenue: 1423.45,
        tracks: [
            { id: 't8', title: 'Shockwave', duration: '3:15', isrc: 'US-JKL-25-00301', explicit: false },
            { id: 't9', title: 'Voltage', duration: '4:45', isrc: 'US-JKL-25-00302', explicit: false }
        ]
    },
    {
        id: '5',
        title: 'Chill Beats Vol. 1',
        artist: 'Lo-Fi Masters',
        releaseDate: '2025-08-05',
        status: 'live',
        artwork: '/artwork5.jpg',
        upc: '123456789016',
        tracksCount: 15,
        totalStreams: 198765,
        revenue: 987.65,
        tracks: [
            { id: 't10', title: 'Sunday Morning', duration: '2:30', isrc: 'US-MNO-25-00401', explicit: false },
            { id: 't11', title: 'Rainy Coffee Shop', duration: '3:12', isrc: 'US-MNO-25-00402', explicit: false }
        ]
    },
];
