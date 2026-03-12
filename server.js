const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Order = require('./models/Order');

const app = express();

// 1. Cấu hình Port linh hoạt cho Render
const PORT = process.env.PORT || 3000;

// 2. Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Quan trọng để nhận ảnh Base64
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Phục vụ các file tĩnh (HTML, CSS, JS) từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// 3. Kết nối MongoDB linh hoạt (Local hoặc Cloud Atlas)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/order_management';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Kết nối Database thành công!'))
    .catch(err => console.error('❌ Lỗi kết nối Database:', err));

// 4. Các API Routes

// Lấy danh sách đơn hàng theo UserId
app.get('/api/orders/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lưu đơn hàng mới
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Cập nhật trạng thái (Refund/Review)
app.put('/api/orders/:id', async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Xóa đơn hàng
app.delete('/api/orders/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa thành công' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 5. Khởi chạy Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server đang chạy tại Port: ${PORT}`);
});