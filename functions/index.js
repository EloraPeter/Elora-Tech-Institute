const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

exports.verifyPayment = functions.https.onRequest(async (req, res) => {
    const { reference, course, email, name, amount } = req.body;
    const paystackSecret = 'sk_test_your_secret_key_here'; // Use environment vars in prod

    // Verify payment
    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${paystackSecret}` }
        });
        if (response.data.data.status !== 'success') throw new Error('Payment failed');

        // Store in Firestore
        await db.collection('students').add({ name, email, course, amount, reference, date: new Date() });

        // Course-specific details
        const courseDetails = {
            'webdev': {
                name: 'Web Dev Basics',
                whatsapp: 'https://chat.whatsapp.com/webdev_group',
                classroom: 'https://classroom.google.com/webdev_link',
                zoom: 'https://zoom.us/j/webdev_zoom',
                materials: 'https://drive.google.com/webdev_materials'
            },
            'advjs': {
                name: 'Advanced JS',
                whatsapp: 'https://chat.whatsapp.com/advjs_group',
                classroom: 'https://classroom.google.com/advjs_link',
                zoom: 'https://zoom.us/j/advjs_zoom',
                materials: 'https://drive.google.com/advjs_materials'
            },
            'fullstack': {
                name: 'Full-Stack',
                whatsapp: 'https://chat.whatsapp.com/fullstack_group',
                classroom: 'https://classroom.google.com/fullstack_link',
                zoom: 'https://zoom.us/j/fullstack_zoom',
                materials: 'https://drive.google.com/fullstack_materials'
            }
        };
        const details = courseDetails[course];

        // Send email
        await admin.firestore().collection('mail').add({
            to: email,
            message: {
                subject: `Welcome to ${details.name}!`,
                html: `
                    <h2>Hi ${name},</h2>
                    <p>Your payment of ₦${amount} is confirmed! Here’s everything you need:</p>
                    <ul>
                        <li><strong>Receipt:</strong> Ref - ${reference}</li>
                        <li><strong>Class Access:</strong> <a href="${details.zoom}">Zoom</a> or <a href="${details.materials}">Pre-recorded</a></li>
                        <li><strong>Student Portal:</strong> <a href="${details.classroom}">Google Classroom</a></li>
                        <li><strong>Community:</strong> <a href="${details.whatsapp}">WhatsApp Group</a></li>
                        <li><strong>Week 1:</strong> Starts Monday, 10 AM WAT - Check materials!</li>
                        <li><strong>Materials:</strong> <a href="${details.materials}">Download Here</a></li>
                    </ul>
                    <p>Excited to have you with us!</p>
                    <p>Elora Tech Team</p>
                `
            }
        });

        res.status(200).send('Payment verified');
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});
