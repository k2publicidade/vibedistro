// Traduções em Português Brasileiro (idioma padrão)

export const translations = {
    common: {
        loading: 'Carregando...',
        save: 'Salvar',
        cancel: 'Cancelar',
        edit: 'Editar',
        delete: 'Excluir',
        manage: 'Gerenciar',
        viewDetails: 'Ver Detalhes',
        search: 'Buscar',
        filter: 'Filtrar',
        all: 'Todos',
        noDataAvailable: 'Nenhum dado disponível',
    },

    nav: {
        dashboard: 'Dashboard',
        catalog: 'Catálogo',
        distribution: 'Distribuição',
        analytics: 'Analytics',
        settings: 'Configurações',
    },

    dashboard: {
        title: 'Visão Geral',
        lastUpdated: 'Última atualização',
        totalStreams: 'Total de Streams',
        revenue: 'Receita',
        activeReleases: 'Releases Ativos',
        monthlyListeners: 'Ouvintes Mensais',
        streamingPerformance: 'Performance de Streaming',
        last30Days: 'Últimos 30 dias',
        topReleases: 'Top Releases',
        topMarkets: 'Principais Mercados',
        recentActivity: 'Atividade Recente',
        pending: 'Pendente',
        streams: 'streams',
    },

    analytics: {
        title: 'Analytics',
        totalStreams: 'Total de Streams',
        uniqueListeners: 'Ouvintes Únicos',
        avgPlayDuration: 'Duração Média',
        skipRate: 'Taxa de Skip',
        streamsOverTime: 'Streams ao Longo do Tempo',
        platformBreakdown: 'Breakdown por Plataforma',
        revenueByPlatform: 'Receita por Plataforma',
        totalRevenue: 'Receita Total',
        topPerformingTracks: 'Top Faixas',
        geographicDistribution: 'Distribuição Geográfica',
        track: 'Faixa',
        album: 'Álbum',
        streams: 'Streams',
        saves: 'Saves',
        playlists: 'Playlists',
        duration: 'Duração',
        ofTotal: 'do total',
    },

    distribution: {
        title: 'Distribuição',
        newDistribution: 'Nova Distribuição',
        totalDistributions: 'Total de Distribuições',
        live: 'Ao Vivo',
        pending: 'Pendente',
        availablePlatforms: 'Plataformas Disponíveis',
        distributionStatus: 'Status de Distribuição',
        recentActivity: 'Atividade Recente',
        released: 'Lançado',
        status: {
            live: 'Ao Vivo',
            pending: 'Pendente',
            review: 'Em Revisão',
            rejected: 'Rejeitado',
        },
    },

    catalog: {
        title: 'Catálogo',
        createRelease: 'Criar Release',
        totalReleases: 'Total de Releases',
        totalStreams: 'Total de Streams',
        totalRevenue: 'Receita Total',
        avgPerRelease: 'Média por Release',
        searchPlaceholder: 'Buscar por título ou artista...',
        all: 'Todos',
        live: 'Ao Vivo',
        review: 'Em Revisão',
        draft: 'Rascunho',
        noReleasesFound: 'Nenhum release encontrado',
        noReleasesMatchingCriteria: 'Nenhum release corresponde aos critérios.',
        tracks: 'faixas',
        streams: 'Streams',
        revenue: 'Receita',

        // Novos campos
        releaseDate: 'Data de Lançamento',
        mainArtist: 'Artista Principal',
        genre: 'Gênero',
        upc: 'UPC',
        isrc: 'ISRC',
        explicit: 'Explícito',
        duration: 'Duração',
        addTrack: 'Adicionar Faixa',
        editRelease: 'Editar Release',
        releaseDetails: 'Detalhes do Lançamento',
        tracklist: 'Lista de Faixas',
        steps: {
            metadata: 'Metadados',
            tracks: 'Faixas',
            review: 'Revisão'
        },
        actions: {
            next: 'Próximo',
            back: 'Voltar',
            submit: 'Finalizar Lançamento'
        }
    },

    dateFilter: {
        last7days: 'Últimos 7 dias',
        last30days: 'Últimos 30 dias',
        last90days: 'Últimos 90 dias',
        thisYear: 'Este ano',
    },

    languages: {
        'pt-BR': 'Português',
        'en': 'English',
        'es': 'Español',
    },
};

export type TranslationKeys = typeof translations;
