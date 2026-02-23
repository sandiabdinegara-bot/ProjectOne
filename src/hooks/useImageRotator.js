import { useState } from 'react';
import Swal from 'sweetalert2';

const useImageRotator = (apiUrl = './api/rotate_image.php') => {
    const [isRotating, setIsRotating] = useState(false);

    /**
     * Rotates an image and handles UI feedback.
     * @param {string} imagePath - The path of the image to rotate.
     * @param {number} degrees - The degrees to rotate (90, 180, 270).
     * @param {function} onSuccess - Callback function to execute on successful rotation.
     */
    const saveRotation = async (imagePath, degrees, onSuccess) => {
        if (!imagePath) return;

        setIsRotating(true);
        try {
            Swal.fire({
                title: 'Menyimpan Rotasi...',
                text: 'Mohon tunggu sebentar',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_path: imagePath,
                    degrees: degrees
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                if (onSuccess) {
                    onSuccess();
                }

                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Rotasi foto berhasil disimpan.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire('Gagal!', data.message || 'Gagal menyimpan rotasi.', 'error');
            }
        } catch (error) {
            console.error("Save rotation error:", error);
            Swal.fire('Error!', 'Terjadi kesalahan sistem.', 'error');
        } finally {
            setIsRotating(false);
        }
    };

    return { saveRotation, isRotating };
};

export default useImageRotator;
