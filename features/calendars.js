        function renderTabs() {
            const container = document.getElementById('tabsContainer');
            if (!container) return;

            container.innerHTML = '';

            Object.keys(appData).forEach(name => {
                const wrapper = document.createElement('div');
                wrapper.className = 'calendar-tab-wrapper';

                const tab = document.createElement('div');
                tab.className = `tab ${name === currentCalName ? 'active' : ''}`;
                tab.innerText = name;
                tab.title = name;

                tab.onclick = (e) => {
                    e.stopPropagation();
                    if (name === currentCalName) {
                        toggleCalendarSettingsPopover(wrapper, name);
                    } else {
                        switchCalendar(name);
                    }
                };

                wrapper.appendChild(tab);
                container.appendChild(wrapper);
            });
        }

        // ============================
        // Календари
        // ============================
        async function submitNewCalendar() {
            const input = document.getElementById('newCalNameInput');
            const errorSpan = document.getElementById('popoverError');
            const name = input.value.trim();

            if (!name) return;

            if (appData[name]) {
                errorSpan.style.display = 'block';
                return;
            }

            const newCal = {
                name,
                colors: [...defaultColors],
                legends: { ...defaultLegends },
                days: {}
            };

            const { error } = await supabaseClient
                .from('calendars')
                .insert([newCal]);

            if (error) {
                console.error('Ошибка создания календаря:', error);
                alert('Не удалось создать календарь: ' + error.message);
                return;
            }

            appData[name] = {
                colors: [...newCal.colors],
                legends: { ...newCal.legends },
                days: {}
            };

            currentCalName = name;
            currentColor = '#34c759';

            closeCalendarPopover();

            renderTabs();
            renderPalette();
            renderLegend();
            renderYear();
        }

        function switchCalendar(name) {
            currentCalName = name;

            const currentCal = appData[currentCalName];

            if (!currentCal.colors.includes(currentColor)) {
                currentColor = currentCal.colors[0] || '#34c759';
            }

            closeAllPopovers();
            closeCalendarPopover();
            closeCalendarSettingsPopovers();

            renderTabs();
            renderPalette();
            renderLegend();
            renderYear();
        }

        function toggleCalendarSettingsPopover(wrapper, name) {
            const existing = wrapper.querySelector('.calendar-popover');
            const wasOpen = existing && existing.classList.contains('active');
            document.querySelectorAll('.calendar-tab-wrapper .calendar-popover').forEach(p => p.remove());
            closeAllPopovers();
            closeCalendarPopover();
            if (wasOpen) return;

            const popover = document.createElement('div');
            popover.className = 'calendar-popover active';
            popover.onclick = (e) => e.stopPropagation();

            const input = document.createElement('input');
            input.type = 'text';
            input.value = name;
            input.placeholder = 'Название...';
            input.onkeydown = (e) => {
                if (e.key === 'Enter') renameCalendar(name, input.value);
            };

            const actions = document.createElement('div');
            actions.className = 'popover-actions';
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'popover-delete';
            deleteBtn.innerText = 'Удалить';
            deleteBtn.disabled = Object.keys(appData).length <= 1;
            deleteBtn.title = deleteBtn.disabled ? 'Нельзя удалить последний календарь' : '';
            deleteBtn.onclick = () => deleteCalendar(name);

            const okBtn = document.createElement('button');
            okBtn.className = 'popover-ok';
            okBtn.innerText = 'OK';
            okBtn.onclick = () => renameCalendar(name, input.value);

            actions.append(deleteBtn, okBtn);
            popover.append(input, actions);
            wrapper.appendChild(popover);
            input.focus();
            input.select();
        }

        async function renameCalendar(oldName, value) {
            const newName = value.trim();
            if (!newName || newName === oldName) {
                renderTabs();
                return;
            }
            if (appData[newName]) return;

            const { error } = await supabaseClient
                .from('calendars')
                .update({ name: newName, updated_at: new Date().toISOString() })
                .eq('name', oldName);
            if (error) {
                console.error('Ошибка переименования календаря:', error);
                return;
            }

            appData[newName] = appData[oldName];
            delete appData[oldName];
            currentCalName = newName;
            renderTabs();
        }

        async function deleteCalendar(name) {
            if (Object.keys(appData).length <= 1) return;

            const nextName = Object.keys(appData).find(calName => calName !== name);
            const { error } = await supabaseClient
                .from('calendars')
                .delete()
                .eq('name', name);
            if (error) {
                console.error('Ошибка удаления календаря:', error);
                return;
            }

            delete appData[name];
            if (currentCalName === name) {
                currentCalName = nextName;
                currentColor = appData[nextName].colors[0] || '#34c759';
            }
            renderTabs();
            renderPalette();
            renderLegend();
            renderYear();
        }

        function changeYear(delta) {
            currentYear += delta;
            document.getElementById('currentYearTitle').innerText = currentYear;
            renderYear();
            renderLegend();
        }
