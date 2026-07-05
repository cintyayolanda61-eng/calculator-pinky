// Mengambil elemen display dari DOM
        const formulaScreen = document.getElementById('formula-screen');
        const currentScreen = document.getElementById('current-screen');

        // State kalkulator
        let currentOperand = '0';   // Angka yang sedang diketik
        let previousOperand = '';  // Angka pertama sebelum operator dimasukkan
        let activeOperator = '';   // Simbol operator aktif (+, -, *, /)
        let resetDisplayOnNextInput = false; // Flag untuk mereset display setelah penekanan '='

        /**
         * Mengupdate nilai pada layar kalkulator secara dinamis
         */
        function updateDisplay() {
            // Membatasi ukuran teks agar tidak meluap (overflow) pada display utama
            if (currentOperand.length > 9) {
                currentScreen.style.fontSize = '1.6rem';
            } else if (currentOperand.length > 6) {
                currentScreen.style.fontSize = '2.2rem';
            } else {
                currentScreen.style.fontSize = '2.5rem';
            }

            // Ganti format tanda minus agar tampak lebih cantik
            let displayValue = currentOperand.replace(/-/g, '−');
            
            // Format angka agar memiliki separator ribuan yang estetik (jika berupa angka valid)
            if (!isNaN(currentOperand) && currentOperand !== '' && !currentOperand.includes('e')) {
                const parts = currentOperand.split('.');
                // Format bagian sebelum desimal dengan standard Indonesia / Lokal
                parts[0] = parseFloat(parts[0]).toLocaleString('id-ID');
                displayValue = parts.join(',');
            }

            // Jika error, tampilkan tulisan langsung
            if (currentOperand === 'Error' || currentOperand === 'Infinity' || currentOperand === 'NaN') {
                currentScreen.innerText = 'Error';
                currentScreen.style.fontSize = '2.2rem';
                return;
            }

            currentScreen.innerText = displayValue;

            // Menampilkan rumus proses kalkulasi di bagian atas
            if (previousOperand !== '') {
                let opSymbol = activeOperator;
                if (opSymbol === '/') opSymbol = '÷';
                if (opSymbol === '*') opSymbol = '×';
                if (opSymbol === '-') opSymbol = '−';
                formulaScreen.innerText = `${previousOperand.replace(/\./g, ',')} ${opSymbol}`;
            } else {
                formulaScreen.innerText = '';
            }
        }

        /**
         * Menambahkan digit angka ke operand saat ini
         * @param {string} number - Angka yang ditekan (0-9)
         */
        function appendNumber(number) {
            // Jika kalkulasi baru saja selesai, ketikan angka baru akan mengganti hasil sebelumnya
            if (resetDisplayOnNextInput) {
                currentOperand = '';
                resetDisplayOnNextInput = false;
            }

            // Mencegah input angka nol ganda berlebih di depan
            if (currentOperand === '0' && number === '0') return;

            // Jika masih '0' awal, ganti langsung dengan angka baru
            if (currentOperand === '0') {
                currentOperand = number;
            } else {
                // Batasi jumlah digit maksimal (misalnya 15 digit) untuk keakuratan kalkulator
                if (currentOperand.replace(/[^0-9]/g, '').length < 15) {
                    currentOperand += number;
                }
            }
            updateDisplay();
        }

        /**
         * Menambahkan tanda desimal (koma / titik)
         */
        function appendDecimal() {
            if (resetDisplayOnNextInput) {
                currentOperand = '0';
                resetDisplayOnNextInput = false;
            }

            // Pastikan desimal tidak dimasukkan dua kali dalam satu operand
            if (!currentOperand.includes('.')) {
                currentOperand += '.';
                updateDisplay();
            }
        }

        /**
         * Mengaktifkan operasi matematika dasar (+, -, *, /)
         * @param {string} operator - Simbol operator internal
         */
        function appendOperator(operator) {
            if (currentOperand === 'Error') return;

            // Jika operator ditekan dan sudah ada kalkulasi sebelumnya yang berjalan, hitung dulu hasilnya
            if (previousOperand !== '' && activeOperator !== '' && currentOperand !== '') {
                calculate();
            }

            activeOperator = operator;
            previousOperand = currentOperand;
            currentOperand = '0';
            resetDisplayOnNextInput = false;
            updateDisplay();
        }

        /**
         * Mengubah nilai menjadi bentuk persen (%)
         */
        function appendPercent() {
            if (currentOperand === 'Error' || currentOperand === '0') return;
            
            try {
                // Membagi angka saat ini dengan 100 secara aman
                const value = parseFloat(currentOperand);
                if (!isNaN(value)) {
                    // Gunakan operasi perkalian desimal presisi untuk meminimalisir bug floating-point
                    currentOperand = (value / 100).toString();
                    updateDisplay();
                    animateResult();
                }
            } catch (e) {
                currentOperand = 'Error';
                updateDisplay();
            }
        }

        /**
         * Melakukan kalkulasi matematika yang aman tanpa eval()
         */
        function calculate() {
            // Pastikan ada operasi yang valid yang bisa dieksekusi
            if (previousOperand === '' || activeOperator === '') return;

            const prev = parseFloat(previousOperand);
            const current = parseFloat(currentOperand);

            // Menghindari kalkulasi jika nilai input tidak valid
            if (isNaN(prev) || isNaN(current)) {
                currentOperand = 'Error';
                updateDisplay();
                return;
            }

            let result = 0;

            // Logika perhitungan manual yang aman
            switch (activeOperator) {
                case '+':
                    result = prev + current;
                    break;
                case '-':
                    result = prev - current;
                    break;
                case '*':
                    result = prev * current;
                    break;
                case '/':
                    if (current === 0) {
                        currentOperand = 'Error'; // Menangani kasus pembagian dengan nol
                        updateDisplay();
                        return;
                    }
                    result = prev / current;
                    break;
                default:
                    return;
            }

            // Memperbaiki masalah floating point standar JS (misal 0.1 + 0.2 = 0.30000000000000004)
            // Menggunakan toPrecision atau pembulatan presisi desimal
            result = Math.round(result * 1e12) / 1e12;

            // Set ke display
            currentOperand = result.toString();
            
            // Tampilkan visual formula hasil penuh di atas
            let opSymbol = activeOperator;
            if (opSymbol === '/') opSymbol = '÷';
            if (opSymbol === '*') opSymbol = '×';
            if (opSymbol === '-') opSymbol = '−';
            formulaScreen.innerText = `${previousOperand.replace(/\./g, ',')} ${opSymbol} ${current.toString().replace(/\./g, ',')} =`;

            // Reset state operand lama
            previousOperand = '';
            activeOperator = '';
            resetDisplayOnNextInput = true;

            updateDisplay();
            animateResult(); // Memicu animasi pop up halus saat hasil muncul
        }

        /**
         * Mereset seluruh inputan kalkulator (Tombol AC)
         */
        function clearAll() {
            currentOperand = '0';
            previousOperand = '';
            activeOperator = '';
            resetDisplayOnNextInput = false;
            updateDisplay();
        }

        /**
         * Menghapus karakter terakhir (Tombol Backspace)
         */
        function deleteLast() {
            if (resetDisplayOnNextInput) {
                // Jika hasil baru keluar, backspace membersihkan semua
                clearAll();
                return;
            }

            if (currentOperand === 'Error' || currentOperand.length <= 1) {
                currentOperand = '0';
            } else {
                currentOperand = currentOperand.slice(0, -1);
            }
            updateDisplay();
        }

        /**
         * Memberikan animasi berdenyut lembut pada layar ketika hasil didapatkan
         */
        function animateResult() {
            currentScreen.classList.remove('pop-animation');
            // Memicu reflow browser agar animasi bisa diulang kembali
            void currentScreen.offsetWidth; 
            currentScreen.classList.add('pop-animation');
        }

        /* ==========================================================================
           8. DUKUNGAN INPUT KEYBOARD
           ========================================================================== */
        document.addEventListener('keydown', (event) => {
            const key = event.key;

            // Memeriksa jika input adalah angka 0-9
            if (/[0-9]/.test(key)) {
                appendNumber(key);
            }
            // Memeriksa tombol desimal (koma atau titik)
            else if (key === '.' || key === ',') {
                appendDecimal();
            }
            // Memeriksa operator aritmatika
            else if (key === '+' || key === '-' || key === '*' || key === '/') {
                event.preventDefault(); // Mencegah scrolling browser pada tombol '/'
                appendOperator(key);
            }
            // Memeriksa tombol Enter atau Sama Dengan untuk kalkulasi
            else if (key === 'Enter' || key === '=') {
                event.preventDefault();
                calculate();
            }
            // Memeriksa tombol Backspace untuk menghapus satu digit
            else if (key === 'Backspace') {
                deleteLast();
            }
            // Memeriksa tombol Escape untuk menghapus total (AC)
            else if (key === 'Escape') {
                clearAll();
            }
            // Memeriksa tombol Persen
            else if (key === '%') {
                appendPercent();
            }
        });