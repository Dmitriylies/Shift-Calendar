        // ============================
        // Годовой календарь
        // ============================
        function renderYear() {
            const yearGrid = document.getElementById('yearGrid');
            yearGrid.innerHTML = '';

            const currentCal = appData[currentCalName];
            if (!currentCal) return;

            for (let m = 0; m < 12; m++) {
                const card = document.createElement('div');
                card.className = 'month-card';

                const title = document.createElement('div');
                title.className = 'month-title';
                title.innerText = monthsNames[m];
                card.appendChild(title);

                const wkHeader = document.createElement('div');
                wkHeader.className = 'weekdays-header';

                weekdays.forEach(wd => {
                    const d = document.createElement('div');
                    d.innerText = wd;
                    wkHeader.appendChild(d);
                });

                card.appendChild(wkHeader);

                const monthGrid = document.createElement('div');
                monthGrid.className = 'month-grid';

                let firstDayIndex = new Date(currentYear, m, 1).getDay();
                firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

                const totalDays = new Date(currentYear, m + 1, 0).getDate();

                for (let i = 0; i < firstDayIndex; i++) {
                    const emptyCell = document.createElement('div');
                    emptyCell.className = 'day-cell empty';
                    monthGrid.appendChild(emptyCell);
                }

                for (let day = 1; day <= totalDays; day++) {
                    const cell = document.createElement('div');
                    cell.className = 'day-cell';

                    const span = document.createElement('span');
                    span.innerText = day;
                    cell.appendChild(span);

                    const monthStr = String(m + 1).padStart(2, '0');
                    const dayStr = String(day).padStart(2, '0');
                    const dateKey = `${currentYear}-${monthStr}-${dayStr}`;

                    updateCellVisuals(cell, currentCal.days[dateKey]);

                    cell.onclick = async () => {
                        await handleCellClick(dateKey, cell, currentCal);
                    };

                    monthGrid.appendChild(cell);
                }

                card.appendChild(monthGrid);
                yearGrid.appendChild(card);
            }
        }

        async function handleCellClick(dateKey, cell, currentCal) {
            const existingValue = currentCal.days[dateKey];

            if (existingValue === currentColor) {
                delete currentCal.days[dateKey];
            } else {
                currentCal.days[dateKey] = currentColor;
            }

            updateCellVisuals(cell, currentCal.days[dateKey]);

            // Сразу сохраняем изменение в Supabase.
            await saveData();

            // Счётчики обновляются без полной перерисовки календаря.
            renderLegend();
        }

        function updateCellVisuals(cell, value) {
            const oldOverlay = cell.querySelector('.overlay');
            const oldStar = cell.querySelector('.star-overlay');

            if (oldOverlay) oldOverlay.remove();
            if (oldStar) oldStar.remove();

            if (!value) return;

            if (value === 'star') {
                const star = document.createElement('div');
                star.className = 'star-overlay';
                star.innerHTML = '★';
                cell.appendChild(star);
            } else {
                const overlay = document.createElement('div');
                overlay.className = 'overlay';
                overlay.style.backgroundColor = value;
                cell.appendChild(overlay);
            }
        }
