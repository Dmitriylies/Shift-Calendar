// СТАБИЛЬНОЕ ЯДРО: тема, popover-ы и загрузка/сохранение данных.

        // ============================
        // Тема
        // ============================
        function toggleTheme() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', currentTheme);
            localStorage.setItem('apple_overlay_theme', currentTheme);
            updateThemeButtonIcon();
        }

        function updateThemeButtonIcon() {
            const btn = document.getElementById('themeToggleBtn');
            if (btn) btn.innerText = currentTheme === 'light' ? '🌙' : '☀️';
        }

        // ============================
        // Popover-ы
        // ============================
        function closeAllPopovers() {
            document.querySelectorAll('.color-popover').forEach(p => p.classList.remove('active'));
            activePopoverCol = null;
            isColorAddPopoverOpen = false;
        }

        function closeCalendarSettingsPopovers() {
            document.querySelectorAll('.calendar-tab-wrapper .calendar-popover').forEach(p => p.remove());
        }

        function closeCalendarPopover() {
            const popover = document.getElementById('calendarPopover');
            if (!popover) return;

            popover.classList.remove('active');

            const error = document.getElementById('popoverError');
            if (error) error.style.display = 'none';
        }

        function toggleCalendarPopover(e) {
            e.stopPropagation();
            closeAllPopovers();

            const popover = document.getElementById('calendarPopover');
            const isActive = popover.classList.contains('active');

            if (!isActive) {
                popover.classList.add('active');

                // Позиционируем popover относительно кнопки
                const btn = e.target.closest('.tab-add-btn') || e.target;
                const rect = btn.getBoundingClientRect();
                popover.style.top = (rect.bottom + 8) + 'px';
                popover.style.left = rect.left + 'px';

                const input = document.getElementById('newCalNameInput');
                input.value = '';
                input.focus();
            } else {
                closeCalendarPopover();
            }
        }

        function handleCalendarKey(e) {
            if (e.key === 'Enter') submitNewCalendar();
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.color-wrapper') && !e.target.closest('.color-add-wrapper')) closeAllPopovers();
            if (!e.target.closest('.tab-add-wrapper')) closeCalendarPopover();
            if (!e.target.closest('.calendar-tab-wrapper')) closeCalendarSettingsPopovers();
        });

        // ============================
        // Загрузка / сохранение данных
        // ============================
        async function initApp() {
            document.getElementById('currentYearTitle').innerText = currentYear;
            updateThemeButtonIcon();

            const { data, error } = await supabaseClient
                .from('calendars')
                .select('*');

            if (error) {
                console.error('Ошибка загрузки календарей:', error);
                alert('Не удалось загрузить календари: ' + error.message);
                return;
            }

            appData = {};

            if (!data || data.length === 0) {
                const defaultCal = {
                    name: 'Основной',
                    colors: [...defaultColors],
                    legends: { ...defaultLegends },
                    days: {}
                };

                const { error: insertError } = await supabaseClient
                    .from('calendars')
                    .insert([defaultCal]);

                if (insertError) {
                    console.error('Ошибка создания основного календаря:', insertError);
                    alert('Не удалось создать основной календарь: ' + insertError.message);
                    return;
                }

                appData['Основной'] = {
                    colors: [...defaultCal.colors],
                    legends: { ...defaultCal.legends },
                    days: {}
                };
            } else {
                data.forEach(row => {
                    appData[row.name] = {
                        colors: Array.isArray(row.colors) ? row.colors : [...defaultColors],
                        legends: row.legends || { ...defaultLegends },
                        days: row.days || {}
                    };
                });
            }

            if (!currentCalName || !appData[currentCalName]) {
                currentCalName = Object.keys(appData)[0];
            }

            const currentCal = appData[currentCalName];

            if (!currentCal.colors.includes(currentColor)) {
                currentColor = currentCal.colors[0] || '#34c759';
            }

            renderTabs();
            renderPalette();
            renderLegend();
            renderYear();
        }

        async function saveData() {
            if (!currentCalName || !appData[currentCalName]) return;

            const cal = appData[currentCalName];

            const { error } = await supabaseClient
                .from('calendars')
                .update({
                    colors: cal.colors,
                    legends: cal.legends,
                    days: cal.days,
                    updated_at: new Date().toISOString()
                })
                .eq('name', currentCalName);

            if (error) {
                console.error('Ошибка сохранения:', error);
            }
        }

        function saveDataDebounced() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveData();
            }, 500);
        }

        async function saveAndRefresh() {
            await saveData();
            await initApp();
        }

        // ============================
        // Модальное окно подтверждения
        // ============================
        let confirmCallback = null;

        function showConfirmModal(message, onConfirm) {
            const modal = document.getElementById('confirmModal');
            const text = document.getElementById('confirmModalText');
            const okBtn = document.getElementById('confirmModalOk');
            const cancelBtn = document.getElementById('confirmModalCancel');

            text.innerText = message;
            confirmCallback = onConfirm;

            modal.classList.add('active');

            const handleConfirm = () => {
                modal.classList.remove('active');
                closeConfirmModal();
                if (confirmCallback) confirmCallback();
            };

            const handleCancel = () => {
                modal.classList.remove('active');
                closeConfirmModal();
            };

            okBtn.onclick = handleConfirm;
            cancelBtn.onclick = handleCancel;

            // Закрытие по Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                    document.removeEventListener('keydown', handleEscape);
                }
            };

            document.addEventListener('keydown', handleEscape);
        }

        function closeConfirmModal() {
            const modal = document.getElementById('confirmModal');
            modal.classList.remove('active');
            confirmCallback = null;
        }

        // Сделать функции глобальными
        window.showConfirmModal = showConfirmModal;
        window.closeConfirmModal = closeConfirmModal;
