// СТАБИЛЬНОЕ ЯДРО: Google/Supabase-авторизация.
// Правки интерфейса календаря не требуют изменений в этом файле.

        // ============================
        // Авторизация
        // ============================
        let isLoggingOut = false;

        // После OAuth очищаем служебные параметры из адресной строки,
        // чтобы повторный вход не использовал старый callback URL.
        if (window.location.search || window.location.hash) {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }

        async function checkUserSession() {
            const { data: { session }, error } = await supabaseClient.auth.getSession();

            if (error) {
                console.error('Ошибка проверки сессии:', error);
                currentUser = null;
                document.getElementById('authScreen').style.display = 'flex';
                return;
            }

            if (session) {
                currentUser = session.user;
                document.getElementById('authScreen').style.display = 'none';

                const emailEl = document.getElementById('userEmailDisplay');
                if (emailEl) emailEl.innerText = currentUser.email || '';

                await initApp();
            } else {
                currentUser = null;
                document.getElementById('userEmailDisplay').innerText = '';
                document.getElementById('authScreen').style.display = 'flex';
            }
        }

        async function loginWithGoogle() {
            if (isLoggingOut) return;

            const button = document.querySelector('.google-btn');
            if (button) {
                button.disabled = true;
                button.style.opacity = '0.6';
            }

            try {
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + window.location.pathname,
                        queryParams: {
                            prompt: 'select_account'
                        }
                    }
                });

                if (error) {
                    console.error('Ошибка Google OAuth:', error);
                    alert(error.message);
                    if (button) {
                        button.disabled = false;
                        button.style.opacity = '1';
                    }
                }
            } catch (err) {
                console.error('Ошибка запуска Google OAuth:', err);
                alert(err.message || 'Не удалось начать авторизацию');
                if (button) {
                    button.disabled = false;
                    button.style.opacity = '1';
                }
            }
        }

        async function logout() {
            if (isLoggingOut) return;
            isLoggingOut = true;

            const button = document.querySelector('.right-controls button');
            if (button) {
                button.disabled = true;
                button.innerText = 'Выход...';
            }

            try {
                const { error } = await supabaseClient.auth.signOut({ scope: 'global' });

                if (error) {
                    console.error('Ошибка выхода:', error);
                    alert(error.message);
                    isLoggingOut = false;
                    if (button) {
                        button.disabled = false;
                        button.innerText = 'Выйти';
                    }
                    return;
                }

                currentUser = null;
                appData = {};
                currentCalName = '';
                document.getElementById('userEmailDisplay').innerText = '';
                document.getElementById('authScreen').style.display = 'flex';

                isLoggingOut = false;
                if (button) {
                    button.disabled = false;
                    button.innerText = 'Выйти';
                }
            } catch (err) {
                console.error('Ошибка выхода:', err);
                alert(err.message || 'Не удалось выйти из аккаунта');
                isLoggingOut = false;
                if (button) {
                    button.disabled = false;
                    button.innerText = 'Выйти';
                }
            }
        }

        // Синхронизируем интерфейс с состоянием Supabase Auth.
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                currentUser = null;
                document.getElementById('userEmailDisplay').innerText = '';
                document.getElementById('authScreen').style.display = 'flex';
                return;
            }

            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                currentUser = session.user;
                document.getElementById('authScreen').style.display = 'none';
                document.getElementById('userEmailDisplay').innerText = currentUser.email || '';
            }
        });
