// СТАБИЛЬНОЕ ЯДРО: настройки Supabase и общее состояние.
// Меняйте только при смене проекта Supabase или структуры данных.

        // ============================
        // Supabase + Google авторизация
        // ============================
        const SUPABASE_URL = 'https://gnczstcivximbigwtyrt.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_GXqipg1rfDcdZ9jRH8U_qg_WF-iLk5e';
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        let currentUser = null;

        // ============================
        // Данные приложения
        // ============================
        let currentYear = new Date().getFullYear();

        const monthsNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
            "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

        const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

        const defaultColors = ['#34c759', '#007aff', '#8e8e93', 'star'];

        const defaultLegends = {
            '#34c759': 'Зеленый',
            '#007aff': 'Синий',
            '#8e8e93': 'Серый',
            'star': 'Важное'
        };
        const availableColors = [
            { value: '#34c759', name: 'Зеленый' },
            { value: '#007aff', name: 'Синий' },
            { value: '#8e8e93', name: 'Серый' },
            { value: '#ff3b30', name: 'Красный' },
            { value: '#ff2d55', name: 'Розовый' }
        ];

        let appData = {};
        let currentCalName = '';
        let currentColor = '#34c759';
        let currentTheme = localStorage.getItem('apple_overlay_theme') || 'light';
        let activePopoverCol = null;
        let isColorAddPopoverOpen = false;
        let saveTimeout = null;

        document.body.setAttribute('data-theme', currentTheme);
