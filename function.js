document.addEventListener('DOMContentLoaded', () => {
    // --- Seleksi Elemen DOM ---
    const permissionButton = document.getElementById('permission-button');
    const initialView = document.getElementById('initial-view');
    const mainContent = document.getElementById('main-content');
    
    // Elemen Modal
    const customModal = document.getElementById('custom-modal');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    // Elemen Alert
    const customAlert = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('alert-message');
    const alertOk = document.getElementById('alert-ok');

    // Elemen Konten Utama
    const loader = document.getElementById('loader');
    const locationData = document.getElementById('location-data');
    const coordsEl = document.getElementById('coords');
    const locationNameEl = document.getElementById('location-name');
    
    // Elemen Galeri
    const uploadButton = document.getElementById('upload-button');
    const imageUpload = document.getElementById('image-upload');
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryPlaceholder = document.getElementById('gallery-placeholder');

    let ambientSynth;

    // --- Fungsi Bantuan ---

    /**
     * Menampilkan alert custom dengan pesan tertentu.
     * @param {string} message - Pesan yang akan ditampilkan.
     */
    const showAlert = (message) => {
        alertMessage.textContent = message;
        customAlert.classList.remove('hidden');
    };

    /**
     * Menyembunyikan alert custom.
     */
    const hideAlert = () => {
        customAlert.classList.add('hidden');
    };

    /**
     * Memulai dan memainkan audio ambient menggunakan Tone.js.
     * Audio hanya akan dimulai setelah interaksi pengguna pertama.
     */
    const startAmbientSound = async () => {
        await Tone.start();
        // Membuat synth dengan efek reverb untuk suara yang lebih luas
        const reverb = new Tone.Reverb(5).toDestination();
        ambientSynth = new Tone.MonoSynth({
            oscillator: { type: 'sine' },
            envelope: { attack: 2, release: 4 },
            filterEnvelope: { attack: 1, baseFrequency: 100, octaves: 3 }
        }).connect(reverb);

        // Membuat loop nada rendah yang menenangkan
        const loop = new Tone.Loop(time => {
            ambientSynth.triggerAttackRelease('C2', '2m', time);
        }, '4m').start(0);

        Tone.Transport.start();
        console.log('Ambient sound started.');
    };

    // --- Logika Utama ---

    /**
     * Menangani permintaan izin lokasi dan menampilkan data.
     */
    const handlePermissionRequest = () => {
        customModal.classList.add('hidden');
        initialView.classList.add('hidden');
        mainContent.classList.remove('hidden');
        loader.classList.remove('hidden');
        locationData.classList.add('hidden');

        // Memulai audio setelah izin diberikan
        startAmbientSound();

        if (!navigator.geolocation) {
            loader.classList.add('hidden');
            showAlert('Geolocation tidak didukung oleh browser Anda.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                coordsEl.textContent = `Koordinat: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                
                // Mengambil nama lokasi dari API
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    if (!response.ok) throw new Error('Gagal mengambil data lokasi.');
                    
                    const data = await response.json();
                    const city = data.address.city || data.address.town || data.address.village || 'Lokasi tidak diketahui';
                    const country = data.address.country || '';
                    locationNameEl.textContent = `${city}, ${country}`;
                } catch (error) {
                    console.error('Error fetching location name:', error);
                    locationNameEl.textContent = 'Tidak dapat mengambil nama lokasi.';
                } finally {
                    loader.classList.add('hidden');
                    locationData.classList.remove('hidden');
                }
            },
            (error) => {
                loader.classList.add('hidden');
                let message = 'Terjadi kesalahan saat mengambil lokasi.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Anda menolak izin akses lokasi.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Informasi lokasi tidak tersedia.';
                        break;
                    case error.TIMEOUT:
                        message = 'Waktu permintaan lokasi habis.';
                        break;
                }
                showAlert(message);
                locationNameEl.textContent = 'Akses lokasi ditolak.';
                locationData.classList.remove('hidden');
            }
        );
    };

    /**
     * Menangani pemilihan file gambar dan menampilkannya di grid.
     * @param {Event} event - Event dari input file.
     */
    const handleImageUpload = (event) => {
        const files = event.target.files;
        if (files.length === 0) {
            return;
        }

        // Sembunyikan placeholder jika ada gambar
        if (galleryPlaceholder) {
            galleryPlaceholder.classList.add('hidden');
        }

        // Proses setiap file yang dipilih
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) {
                return; // Lewati file yang bukan gambar
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'aspect-square bg-black/20 rounded-lg overflow-hidden animate-fade-in';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'w-full h-full object-cover';
                
                imgContainer.appendChild(img);
                galleryGrid.appendChild(imgContainer);
            };
            reader.readAsDataURL(file);
        });
    };


    // --- Event Listeners ---
    permissionButton.addEventListener('click', () => {
        customModal.classList.remove('hidden');
    });

    confirmYes.addEventListener('click', handlePermissionRequest);

    confirmNo.addEventListener('click', () => {
        customModal.classList.add('hidden');
        showAlert('Akses dibatalkan. Beberapa fitur mungkin tidak berfungsi.');
    });

    alertOk.addEventListener('click', hideAlert);

    uploadButton.addEventListener('click', () => {
        imageUpload.click(); // Memicu dialog pemilihan file
    });

    imageUpload.addEventListener('change', handleImageUpload);
});
