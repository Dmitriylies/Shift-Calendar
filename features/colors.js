        // ============================
        // Цвета
        // ============================
        function addNewColor(color) {
            const currentCal = appData[currentCalName];
            const colorDefinition = availableColors.find(item => item.value === color);
            if (!currentCal || !colorDefinition || currentCal.colors.includes(color)) return;

            const starIdx = currentCal.colors.indexOf('star');
            if (starIdx !== -1) {
                currentCal.colors.splice(starIdx, 0, color);
            } else {
                currentCal.colors.push(color);
            }
            currentCal.legends[color] = colorDefinition.name;
            currentColor = color;
            closeAllPopovers();
            saveAndRefresh();
        }

        function getColorCount(currentCal, col) {
            let count = 0;

            for (const dateKey in currentCal.days) {
                if (
                    dateKey.startsWith(String(currentYear)) &&
                    currentCal.days[dateKey] === col
                ) {
                    count++;
                }
            }

            return count;
        }

        function renderPalette() {
            const paletteContainer = document.getElementById('colorPalette');
            paletteContainer.innerHTML = '';

            const currentCal = appData[currentCalName];
            if (!currentCal) return;

            currentCal.colors.forEach(col => {
                if (col === '') return;

                const wrapper = document.createElement('div');
                wrapper.className = 'color-wrapper';

                const btn = document.createElement('div');
                btn.className = `color-btn ${currentColor === col ? 'selected' : ''}`;

                if (col === 'star') {
                    btn.style.backgroundColor = 'rgba(255, 149, 0, 0.15)';
                    btn.style.border = '1.5px solid #ff9500';
                    btn.title = currentCal.legends[col] || 'Звездочка';
                    btn.innerHTML = '★';
                    btn.style.color = '#ff9500';
                } else {
                    btn.style.backgroundColor = col;
                    btn.title = currentCal.legends[col] || col;
                }

                btn.onclick = (e) => {
                    e.stopPropagation();

                    if (currentColor === col) {
                        closeCalendarPopover();

                        const popover = wrapper.querySelector('.color-popover');
                        const isActive = popover.classList.contains('active');

                        closeAllPopovers();

                        if (!isActive) {
                            popover.classList.add('active');
                            activePopoverCol = col;

                            const inputField = popover.querySelector('input');
                            inputField.value = currentCal.legends[col] || '';
                            inputField.focus();
                        }
                    } else {
                        currentColor = col;
                        closeAllPopovers();
                        renderPalette();
                    }
                };

                wrapper.appendChild(btn);

                const popover = document.createElement('div');
                popover.className =
                    `color-popover ${activePopoverCol === col ? 'active' : ''}`;

                popover.onclick = (e) => e.stopPropagation();

                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentCal.legends[col] || '';
                input.placeholder = 'Название...';

                input.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        savePopoverValue(col, input.value);
                    }
                };

                const actionsRow = document.createElement('div');
                actionsRow.className = 'popover-actions';

                if (currentCal.colors.length > 1) {
                    const delBtn = document.createElement('button');
                    delBtn.className = 'popover-delete';
                    delBtn.innerText = 'Удалить';

                    delBtn.onclick = async () => {
                        if (!confirm('Удалить этот цвет?')) return;

                        currentCal.colors = currentCal.colors.filter(c => c !== col);
                        delete currentCal.legends[col];

                        for (const dKey in currentCal.days) {
                            if (currentCal.days[dKey] === col) {
                                delete currentCal.days[dKey];
                            }
                        }

                        currentColor = currentCal.colors[0] || '#34c759';

                        closeAllPopovers();
                        await saveAndRefresh();
                    };

                    actionsRow.appendChild(delBtn);
                } else {
                    const emptyDiv = document.createElement('div');
                    actionsRow.appendChild(emptyDiv);
                }

                const okBtn = document.createElement('button');
                okBtn.className = 'popover-ok';
                okBtn.innerText = 'OK';
                okBtn.onclick = () => savePopoverValue(col, input.value);

                actionsRow.appendChild(okBtn);

                popover.appendChild(input);
                popover.appendChild(actionsRow);
                wrapper.appendChild(popover);

                paletteContainer.appendChild(wrapper);
            });

            const addWrapper = document.createElement('div');
            addWrapper.className = 'color-add-wrapper';

            const addBtn = document.createElement('div');
            addBtn.className = 'color-add-btn';
            addBtn.innerHTML = '+';
            addBtn.title = 'Добавить новый цвет';

            addBtn.onclick = (e) => {
                e.stopPropagation();
                closeCalendarPopover();
                const wasOpen = isColorAddPopoverOpen;
                closeAllPopovers();
                if (wasOpen) {
                    renderPalette();
                    return;
                }
                isColorAddPopoverOpen = true;
                renderPalette();
            };

            addWrapper.appendChild(addBtn);

            if (isColorAddPopoverOpen) {
                const colorPopover = document.createElement('div');
                colorPopover.className = 'color-popover active';
                colorPopover.onclick = (e) => e.stopPropagation();

                const remainingColors = availableColors.filter(item => !currentCal.colors.includes(item.value));
                if (remainingColors.length === 0) {
                    const message = document.createElement('div');
                    message.className = 'popover-message';
                    message.innerText = 'Все пять доступных цветов уже добавлены.';
                    colorPopover.appendChild(message);
                } else {
                    const choices = document.createElement('div');
                    choices.className = 'color-choice-list';
                    remainingColors.forEach(item => {
                        const choice = document.createElement('button');
                        choice.className = 'color-choice-btn';
                        choice.style.backgroundColor = item.value;
                        choice.title = item.name;
                        choice.setAttribute('aria-label', item.name);
                        choice.onclick = () => addNewColor(item.value);
                        choices.appendChild(choice);
                    });
                    colorPopover.appendChild(choices);
                }
                addWrapper.appendChild(colorPopover);
            }

            paletteContainer.appendChild(addWrapper);
        }

        function savePopoverValue(col, value) {
            const currentCal = appData[currentCalName];

            currentCal.legends[col] = value.trim() || col;

            saveDataDebounced();
            renderPalette();
            renderLegend();
            closeAllPopovers();
        }

        // ============================
        // Легенда
        // ============================
        function renderLegend() {
            const container = document.getElementById('legendContainer');
            container.innerHTML = '';

            const currentCal = appData[currentCalName];
            if (!currentCal) return;

            currentCal.colors.forEach(col => {
                if (col === '') return;

                const item = document.createElement('div');
                item.className = 'legend-item';

                const dot = document.createElement('div');
                dot.className = 'legend-dot';

                if (col === 'star') {
                    dot.style.backgroundColor = '#ff9500';
                } else {
                    dot.style.backgroundColor = col;
                }

                const nameSpan = document.createElement('span');
                nameSpan.className = 'legend-name';
                nameSpan.innerText = currentCal.legends[col] || col;

                const countBadge = document.createElement('span');
                countBadge.className = 'counter-badge';
                countBadge.innerText = `(${getColorCount(currentCal, col)})`;

                item.appendChild(dot);
                item.appendChild(nameSpan);
                item.appendChild(countBadge);

                container.appendChild(item);
            });
        }
