const orderForm = document.getElementById('orderForm');
const orderList = document.getElementById('orderList');
const emptyMsg = document.getElementById('emptyMsg');
const storageBar = document.getElementById('storageBar');
const imgError = document.getElementById('imgError');
const mainContent = document.getElementById('mainContent');
const userIdInput = document.getElementById('userIdInput');
const userInfo = document.getElementById('userInfo');
const customAlert = document.getElementById('customAlert');

// Tự động nhận domain của server (Localhost hoặc Domain khi Deploy)
const API_URL = window.location.origin + '/api';

let currentUserId = "";
let orders = []; 
let deleteTargetId = null;

// 1. Đăng nhập và lấy dữ liệu từ Server
window.loginUser = async function () {
    const id = userIdInput.value.trim();
    if (!id) {
        alert("Vui lòng nhập ID để tiếp tục.");
        return;
    }

    currentUserId = id;

    try {
        const response = await fetch(`${API_URL}/orders/${currentUserId}`);
        if (!response.ok) throw new Error("Không thể lấy dữ liệu");
        
        orders = await response.json();

        // Mở khóa giao diện
        mainContent.classList.remove('opacity-40', 'pointer-events-none');
        userInfo.innerText = "Đang xem dữ liệu thực tế của: " + currentUserId;
        userInfo.classList.add('text-green-400');

        renderOrders();
        updateStorageIndicator();
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối Server. Hệ thống có thể đang khởi động lại (mất ~30s trên Render Free).");
    }
};

// 2. Nhóm đơn hàng theo Seller
function groupOrdersBySeller(orderArray) {
    return orderArray.reduce((groups, order) => {
        const seller = order.seller || "Chưa xác định";
        if (!groups[seller]) groups[seller] = [];
        groups[seller].push(order);
        return groups;
    }, {});
}

// 3. Hiển thị danh sách đơn hàng
function renderOrders() {
    orderList.innerHTML = '';

    if (orders.length === 0) {
        checkEmpty();
        return;
    }

    const grouped = groupOrdersBySeller(orders);

    Object.keys(grouped).sort().forEach(sellerName => {
        const sellerOrders = grouped[sellerName];
        const groupContainer = document.createElement('div');
        groupContainer.className = "seller-group mb-10";

        const headerHtml = `
            <div class="seller-group-header border-b-2 border-blue-400 mb-6 flex justify-between items-end">
                <h3 class="text-xl font-black text-blue-800 uppercase tracking-wide bg-blue-100 px-3 py-1 rounded-t-lg">
                    Seller: ${sellerName}
                </h3>
                <span class="text-xs font-bold text-blue-500 mb-1">${sellerOrders.length} đơn hàng</span>
            </div>
        `;
        groupContainer.innerHTML = headerHtml;

        sellerOrders.forEach((order) => {
            const refundBadgeClass = (order.status === 'Đã Refund') ? 'bg-green-500' : 'bg-orange-400';
            let reviewBadgeClass = 'bg-gray-400';
            let reviewText = order.reviewStatus || 'Chưa Review';

            if (reviewText === 'Đã Review') {
                reviewBadgeClass = 'bg-purple-500';
                reviewText = 'Đã Viết';
            } else if (reviewText === 'Review đã được chấp nhận') {
                reviewBadgeClass = 'bg-emerald-600 font-bold';
                reviewText = 'Đã Chấp Nhận ✓';
            }

            const orderHtml = `
                <div class="order-item group relative">
                    <div class="flex justify-between items-start">
                        <p class="text-lg font-bold text-gray-800">Order # ${order.orderId}</p>
                        <button onclick="confirmDelete('${order._id}')" class="text-gray-400 text-xs hover:text-red-600 transition-colors uppercase font-bold tracking-tighter">
                            [Xóa]
                        </button>
                    </div>
                    <div class="mt-1 space-y-1">
                        <p class="text-sm text-gray-600">) PP: <a href="mailto:${order.email}" class="order-link font-medium">${order.email}</a></p>
                        <p class="text-sm text-gray-500">Bank: <span class="text-blue-700 font-medium">${order.bank || 'N/A'}</span></p>
                    </div>
                    <img src="${order.image}" alt="Sản phẩm" class="product-img">
                    <div class="mt-3 flex flex-wrap items-center gap-3">
                        <div class="text-sm font-bold">
                            Refund: <span class="${refundBadgeClass} text-white px-2 py-0.5 rounded cursor-pointer btn-status-toggle shadow-sm" onclick="toggleStatus('${order._id}')">${order.status}</span>
                        </div>
                        <div class="text-sm font-bold">
                            Review: <span class="${reviewBadgeClass} text-white px-2 py-0.5 rounded cursor-pointer btn-status-toggle shadow-sm" onclick="toggleReview('${order._id}')">${reviewText}</span>
                        </div>
                        <div class="text-sm font-bold text-gray-700">
                            Giá: $${parseFloat(order.price).toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
            groupContainer.insertAdjacentHTML('beforeend', orderHtml);
        });
        orderList.appendChild(groupContainer);
    });
    checkEmpty();
}

// 4. Xử lý lưu đơn hàng mới lên API
orderForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!currentUserId) return;

    const imageFile = document.getElementById('orderImage').files[0];
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = async function (event) {
            const newOrder = {
                userId: currentUserId,
                orderId: document.getElementById('orderId').value,
                email: document.getElementById('orderEmail').value,
                seller: document.getElementById('orderSeller').value,
                price: document.getElementById('orderPrice').value,
                bank: document.getElementById('orderBank').value,
                status: document.querySelector('input[name="refundStatus"]:checked').value,
                reviewStatus: document.querySelector('input[name="reviewStatus"]:checked').value,
                image: event.target.result
            };

            try {
                const response = await fetch(`${API_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newOrder)
                });

                if (response.ok) {
                    orderForm.reset();
                    imgError.classList.add('hidden');
                    window.loginUser(); // Refresh danh sách
                }
            } catch (err) {
                alert("Lỗi khi gửi dữ liệu lên Server!");
            }
        };
        reader.readAsDataURL(imageFile);
    }
});

// 5. Cập nhật trạng thái Refund
window.toggleStatus = async function (dbId) {
    const order = orders.find(o => o._id === dbId);
    if (!order) return;
    const newStatus = (order.status === 'Chưa Refund') ? 'Đã Refund' : 'Chưa Refund';

    try {
        await fetch(`${API_URL}/orders/${dbId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        window.loginUser();
    } catch (err) {
        alert("Lỗi cập nhật trạng thái!");
    }
};

// 6. Cập nhật trạng thái Review
window.toggleReview = async function (dbId) {
    const order = orders.find(o => o._id === dbId);
    if (!order) return;

    let nextReview;
    const current = order.reviewStatus;
    if (current === 'Chưa Review') nextReview = 'Đã Review';
    else if (current === 'Đã Review') nextReview = 'Review đã được chấp nhận';
    else nextReview = 'Chưa Review';

    try {
        await fetch(`${API_URL}/orders/${dbId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewStatus: nextReview })
        });
        window.loginUser();
    } catch (err) {
        alert("Lỗi cập nhật Review!");
    }
};

// 7. Xử lý Xóa qua API
window.confirmDelete = function (dbId) {
    deleteTargetId = dbId;
    customAlert.classList.add('active-modal');
};

document.getElementById('alertConfirm').onclick = async () => {
    if (deleteTargetId) {
        try {
            const res = await fetch(`${API_URL}/orders/${deleteTargetId}`, { method: 'DELETE' });
            if (res.ok) window.loginUser();
        } catch (err) {
            alert("Lỗi xóa đơn hàng!");
        }
    }
    closeAlert();
};

function closeAlert() {
    customAlert.classList.remove('active-modal');
    deleteTargetId = null;
}

document.getElementById('alertClose').onclick = closeAlert;

function checkEmpty() {
    emptyMsg.classList.toggle('hidden', orders.length > 0);
}

function updateStorageIndicator() {
    const limit = 100; 
    const percent = Math.min((orders.length / limit) * 100, 100);
    storageBar.style.width = percent + '%';
    storageBar.className = percent > 90 ? 'h-1 bg-red-500 rounded-full' : 'h-1 bg-blue-500 rounded-full';
}

document.getElementById('orderImage').onchange = function () {
    const file = this.files[0];
    if (file && file.size > 800 * 1024) { 
        imgError.classList.remove('hidden');
    } else {
        imgError.classList.add('hidden');
    }
};