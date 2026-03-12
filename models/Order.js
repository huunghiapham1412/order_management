const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Để phân biệt dữ liệu của từng người
    orderId: String,
    email: String,
    seller: String,
    price: Number,
    bank: String,
    status: { type: String, default: 'Chưa Refund' },
    reviewStatus: { type: String, default: 'Chưa Review' },
    image: String, // Lưu dưới dạng Base64 (chuỗi text dài)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);