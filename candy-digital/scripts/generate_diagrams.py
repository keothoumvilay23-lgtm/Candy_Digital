# -*- coding: utf-8 -*-
"""Generate UML Use Case and Sequence diagram PNGs for thesis report."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Ellipse, FancyArrowPatch
import os

DIAGRAM_DIR = os.path.join(os.path.dirname(__file__), 'diagrams')
os.makedirs(DIAGRAM_DIR, exist_ok=True)

plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 9


def save_fig(name, fig):
    path = os.path.join(DIAGRAM_DIR, name)
    fig.savefig(path, dpi=180, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    return path


def draw_actor(ax, x, y, label):
    ax.add_patch(Ellipse((x, y + 0.35), 0.22, 0.22, fc='white', ec='black', lw=1.2))
    ax.plot([x, x], [y + 0.24, y - 0.05], 'k-', lw=1.2)
    ax.plot([x - 0.18, x + 0.18], [y + 0.05, y + 0.05], 'k-', lw=1.2)
    ax.plot([x, x - 0.15], [y - 0.05, y - 0.35], 'k-', lw=1.2)
    ax.plot([x, x + 0.15], [y - 0.05, y - 0.35], 'k-', lw=1.2)
    ax.text(x, y - 0.55, label, ha='center', va='top', fontsize=8, fontweight='bold')


def draw_use_case(ax, x, y, w, h, label):
    e = Ellipse((x, y), w, h, fc='#E8F4FD', ec='#1F4E79', lw=1.2)
    ax.add_patch(e)
    ax.text(x, y, label, ha='center', va='center', fontsize=7.5, wrap=True)


def connect_uc(ax, ax_x, ax_y, uc_x, uc_y):
    ax.plot([ax_x, uc_x], [ax_y, uc_y], 'k-', lw=0.8)


def use_case_overall():
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis('off')
    ax.add_patch(FancyBboxPatch((2.2, 0.8), 8.8, 6.4, boxstyle='round,pad=0.02',
                                fc='#FAFAFA', ec='#333', lw=1.5, linestyle='--'))
    ax.text(6.6, 7.0, 'He thong Candy Digital', ha='center', fontsize=11, fontweight='bold')

    draw_actor(ax, 0.8, 4.0, 'Khach vang lai')
    draw_actor(ax, 0.8, 2.0, 'Khach hang')
    draw_actor(ax, 11.2, 5.0, 'Quan tri vien')

    cases = [
        (4.0, 6.2, 'Xem san pham'),
        (6.6, 6.2, 'Tim kiem / loc SP'),
        (9.2, 6.2, 'Chat AI tu van'),
        (4.0, 4.8, 'Dang ky / Dang nhap'),
        (6.6, 4.8, 'Dat hang / Thanh toan'),
        (9.2, 4.8, 'Xem khuyen mai'),
        (4.0, 3.4, 'Quan ly gio hang'),
        (6.6, 3.4, 'Quan ly don hang'),
        (9.2, 3.4, 'Cap nhat ho so'),
        (4.5, 2.0, 'Quan ly SP & DM'),
        (6.6, 2.0, 'Quan ly khuyen mai'),
        (8.7, 2.0, 'Quan ly don & TT'),
        (6.6, 0.9, 'Dashboard & Bao cao'),
    ]
    for x, y, label in cases:
        draw_use_case(ax, x, y, 2.0, 0.55, label)

    for uc in [(4.0, 6.2), (6.6, 6.2), (9.2, 6.2)]:
        connect_uc(ax, 1.2, 4.0, uc[0] - 0.9, uc[1])
    for uc in [(4.0, 4.8), (6.6, 4.8), (9.2, 4.8), (4.0, 3.4), (6.6, 3.4), (9.2, 3.4), (9.2, 6.2)]:
        connect_uc(ax, 1.2, 2.0, uc[0] - 0.9 if uc[0] < 8 else uc[0], uc[1])
    for uc in [(4.5, 2.0), (6.6, 2.0), (8.7, 2.0), (6.6, 0.9)]:
        connect_uc(ax, 10.8, 5.0, uc[0] + 0.9, uc[1])

    ax.set_title('Hinh 3.2: So do Use Case tong quat he thong', fontsize=12, fontweight='bold', pad=12)
    return save_fig('use_case_overall.png', fig)


def use_case_customer():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')
    ax.add_patch(FancyBboxPatch((2.0, 0.6), 7.0, 5.8, boxstyle='round,pad=0.02',
                                fc='#FAFAFA', ec='#333', lw=1.5, linestyle='--'))
    ax.text(5.5, 6.1, 'Module Khach hang', ha='center', fontsize=11, fontweight='bold')
    draw_actor(ax, 0.7, 3.5, 'Khach hang')

    cases = [
        (3.5, 5.5, 'Dang ky tai khoan'),
        (5.5, 5.5, 'Dang nhap'),
        (7.5, 5.5, 'Xem chi tiet SP'),
        (3.5, 4.5, 'Chon mau / dung luong'),
        (5.5, 4.5, 'Them vao gio hang'),
        (7.5, 4.5, 'Dat hang (Checkout)'),
        (3.5, 3.5, 'Chon PT thanh toan'),
        (5.5, 3.5, 'Xem lich su don'),
        (7.5, 3.5, 'Huy don hang'),
        (3.5, 2.5, 'Xem khuyen mai'),
        (5.5, 2.5, 'Chat AI tu van'),
        (7.5, 2.5, 'Cap nhat ho so'),
        (5.5, 1.5, 'Doi mat khau'),
    ]
    for x, y, label in cases:
        draw_use_case(ax, x, y, 1.7, 0.5, label)
        connect_uc(ax, 1.0, 3.5, x - 0.75, y)

    ax.set_title('Hinh 3.3: So do Use Case - Khach hang', fontsize=12, fontweight='bold', pad=12)
    return save_fig('use_case_customer.png', fig)


def use_case_admin():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')
    ax.add_patch(FancyBboxPatch((2.0, 0.6), 7.0, 5.8, boxstyle='round,pad=0.02',
                                fc='#FAFAFA', ec='#333', lw=1.5, linestyle='--'))
    ax.text(5.5, 6.1, 'Module Quan tri', ha='center', fontsize=11, fontweight='bold')
    draw_actor(ax, 0.7, 3.5, 'Admin')

    cases = [
        (3.5, 5.5, 'Xem Dashboard'),
        (5.5, 5.5, 'CRUD San pham'),
        (7.5, 5.5, 'CRUD Danh muc'),
        (3.5, 4.5, 'Quan ly khuyen mai'),
        (5.5, 4.5, 'Quan ly don hang'),
        (7.5, 4.5, 'Xac nhan thanh toan'),
        (3.5, 3.5, 'Cap nhat trang thai don'),
        (5.5, 3.5, 'Xuat Excel don hang'),
        (7.5, 3.5, 'Quan ly nguoi dung'),
        (3.5, 2.5, 'Cau hinh thanh toan'),
        (5.5, 2.5, 'Quan ly tai khoan Admin'),
        (7.5, 2.5, 'Upload anh / QR'),
    ]
    for x, y, label in cases:
        draw_use_case(ax, x, y, 1.7, 0.5, label)
        connect_uc(ax, 1.0, 3.5, x - 0.75, y)

    ax.set_title('Hinh 3.4: So do Use Case - Quan tri vien', fontsize=12, fontweight='bold', pad=12)
    return save_fig('use_case_admin.png', fig)


def sequence_diagram(title, filename, actors, messages, note=''):
    n = len(actors)
    fig, ax = plt.subplots(figsize=(max(10, n * 2.2), 8))
    ax.set_xlim(0, n)
    ax.set_ylim(0, 10)
    ax.axis('off')

    xs = [(i + 0.5) * (n - 1) / max(n - 1, 1) + 0.3 for i in range(n)] if n > 1 else [n / 2]
    if n == 1:
        xs = [n / 2]
    elif n == 2:
        xs = [0.8, n - 0.8]
    else:
        xs = [0.6 + i * (n - 1.2) / (n - 1) for i in range(n)]

    top = 9.2
    for i, actor in enumerate(actors):
        ax.add_patch(FancyBboxPatch((xs[i] - 0.55, top - 0.25), 1.1, 0.5,
                                    boxstyle='round,pad=0.02', fc='#D9E2F3', ec='#1F4E79', lw=1))
        ax.text(xs[i], top, actor, ha='center', va='center', fontsize=8, fontweight='bold')
        ax.plot([xs[i], xs[i]], [top - 0.3, 0.8], '--', color='#888', lw=0.8)

    y = top - 0.8
    step = 0.55
    msg_num = 1
    for src, dst, label, style in messages:
        x1, x2 = xs[src], xs[dst]
        color = '#1F4E79' if style == 'sync' else '#666'
        ls = '-' if style == 'sync' else '--'
        arrow = FancyArrowPatch((x1, y), (x2, y), arrowstyle='->', mutation_scale=10,
                                color=color, lw=1.0, linestyle=ls)
        ax.add_patch(arrow)
        mid = (x1 + x2) / 2
        ax.text(mid, y + 0.08, f'{msg_num}. {label}', ha='center', va='bottom', fontsize=7.5,
                bbox=dict(boxstyle='round,pad=0.2', fc='white', ec='none', alpha=0.85))
        y -= step
        msg_num += 1

    if note:
        ax.text(n / 2, 0.3, note, ha='center', fontsize=7, style='italic', color='#555')

    ax.set_title(title, fontsize=11, fontweight='bold', pad=10)
    return save_fig(filename, fig)


def sequence_login():
    return sequence_diagram(
        'Hinh 3.5: So do tuan tu - Dang nhap',
        'seq_login.png',
        ['Khach hang', 'Frontend', 'Backend API', 'MySQL'],
        [
            (0, 1, 'Nhap email/mat khau', 'sync'),
            (1, 2, 'POST /api/auth/login', 'sync'),
            (2, 3, 'SELECT user WHERE email', 'sync'),
            (3, 2, 'Tra ve user + password hash', 'sync'),
            (2, 2, 'bcrypt.compare + jwt.sign', 'sync'),
            (2, 1, 'JSON {token, user}', 'sync'),
            (1, 0, 'Luu token localStorage', 'sync'),
        ],
        'JWT het han sau 7 ngay'
    )


def sequence_order():
    return sequence_diagram(
        'Hinh 3.6: So do tuan tu - Dat hang (Checkout)',
        'seq_order.png',
        ['Khach hang', 'Frontend', 'Backend', 'MySQL'],
        [
            (0, 1, 'Nhan Checkout, nhap dia chi + PT TT', 'sync'),
            (1, 2, 'POST /api/orders (JWT)', 'sync'),
            (2, 3, 'BEGIN TRANSACTION', 'sync'),
            (2, 3, 'SELECT cart items + kiem tra ton kho', 'sync'),
            (2, 3, 'INSERT orders + order_items', 'sync'),
            (2, 3, 'UPDATE stock (products/variants)', 'sync'),
            (2, 3, 'DELETE FROM carts', 'sync'),
            (2, 3, 'COMMIT', 'sync'),
            (2, 1, 'Tra ve ma don + thong tin TT/QR', 'sync'),
            (1, 0, 'Hien thi xac nhan dat hang', 'sync'),
        ],
        'Rollback neu bat ky buoc nao that bai'
    )


def sequence_chatbot():
    return sequence_diagram(
        'Hinh 3.7: So do tuan tu - Chatbot AI (Candy AI)',
        'seq_chatbot.png',
        ['Khach hang', 'Frontend', 'Backend', 'MySQL', 'Gemini API'],
        [
            (0, 1, 'Mo widget chat', 'sync'),
            (1, 2, 'GET /api/chat/session', 'sync'),
            (2, 3, 'INSERT/SELECT chat_sessions', 'sync'),
            (0, 1, 'Nhap cau hoi', 'sync'),
            (1, 2, 'POST /api/chat/message', 'sync'),
            (2, 3, 'INSERT user message + SELECT history', 'sync'),
            (2, 3, 'SELECT 30 products (catalog)', 'sync'),
            (2, 4, 'generateContent (system prompt + history)', 'sync'),
            (4, 2, 'Tra ve noi dung AI', 'sync'),
            (2, 3, 'INSERT assistant message', 'sync'),
            (2, 1, 'JSON {reply}', 'sync'),
            (1, 0, 'Hien thi phan hoi AI', 'sync'),
        ],
        'Model: gemini-2.5-flash'
    )


def sequence_payment():
    return sequence_diagram(
        'Hinh 3.8: So do tuan tu - Xac nhan thanh toan chuyen khoan',
        'seq_payment.png',
        ['Khach hang', 'Ngan hang', 'Webhook Sepay', 'Backend', 'MySQL'],
        [
            (0, 1, 'Chuyen khoan (noi dung DHxxxxxx)', 'sync'),
            (1, 2, 'Sao ke giao dich moi', 'sync'),
            (2, 3, 'POST /api/orders/webhook/bank-incoming', 'sync'),
            (3, 4, 'Tim don theo ma DH + so tien', 'sync'),
            (3, 4, 'UPDATE payment_status = paid', 'sync'),
            (3, 2, 'HTTP 200 OK', 'sync'),
        ],
        'Can cau hinh BANK_WEBHOOK_SECRET'
    )


def draw_entity(ax, x, y, w, h, name, fields, color='#E8F4FD'):
    box = FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle='round,pad=0.02',
                         fc=color, ec='#1F4E79', lw=1.2)
    ax.add_patch(box)
    ax.plot([x - w / 2, x + w / 2], [y + h / 2 - 0.22, y + h / 2 - 0.22], color='#1F4E79', lw=1)
    ax.text(x, y + h / 2 - 0.12, name, ha='center', va='center', fontsize=7.5, fontweight='bold')
    field_text = '\n'.join(fields[:5])
    ax.text(x, y - 0.05, field_text, ha='center', va='center', fontsize=6.2, linespacing=1.15)


def draw_relation(ax, x1, y1, x2, y2, label=''):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color='#444', lw=0.9))
    if label:
        ax.text((x1 + x2) / 2, (y1 + y2) / 2 + 0.08, label, ha='center', fontsize=6, color='#333')


def erd_diagram():
    fig, ax = plt.subplots(figsize=(16, 11))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 11)
    ax.axis('off')
    ax.text(8, 10.5, 'So do ERD - Co so du lieu Candy Digital (14 bang)', ha='center',
            fontsize=12, fontweight='bold')

    entities = {
        'users': (2.0, 9.0, 2.2, 1.35, ['PK id', 'name, email', 'password', 'role']),
        'categories': (5.5, 9.0, 2.2, 1.35, ['PK id', 'name, slug', 'FK parent_id']),
        'products': (9.0, 9.0, 2.2, 1.35, ['PK id', 'FK category_id', 'name, price', 'stock, brand']),
        'product_images': (12.0, 9.5, 2.0, 1.1, ['PK id', 'FK product_id', 'image_url']),
        'product_colors': (12.0, 8.0, 2.0, 1.1, ['PK id', 'FK product_id', 'name, hex_code']),
        'product_variants': (12.0, 6.5, 2.0, 1.1, ['PK id', 'FK product_id', 'storage, price', 'stock']),
        'carts': (2.0, 6.5, 2.2, 1.35, ['PK id', 'FK user_id', 'FK product_id', 'FK variant_id', 'quantity']),
        'orders': (5.5, 6.5, 2.2, 1.35, ['PK id', 'FK user_id', 'total_price', 'payment_method', 'status']),
        'order_items': (9.0, 6.5, 2.2, 1.35, ['PK id', 'FK order_id', 'FK product_id', 'quantity, unit_price']),
        'chat_sessions': (2.0, 4.0, 2.2, 1.1, ['PK id', 'FK user_id', 'session_token']),
        'chat_messages': (5.5, 4.0, 2.2, 1.1, ['PK id', 'FK session_id', 'role, content']),
        'payment_settings': (9.0, 4.0, 2.2, 1.1, ['PK id', 'method', 'account_*', 'qr_image_url']),
        'promotion_campaigns': (12.0, 4.0, 2.2, 1.2, ['PK id', 'name, slug', 'discount_%', 'starts/ends']),
        'promotion_targets': (12.0, 2.3, 2.2, 1.1, ['PK id', 'FK campaign_id', 'target_type/id']),
    }

    pos = {}
    for name, (x, y, w, h, fields) in entities.items():
        draw_entity(ax, x, y, w, h, name, fields)
        pos[name] = (x, y, w, h)

    def edge(a, b, lx=0, ly=0):
        x1, y1, w1, h1 = pos[a]
        x2, y2, w2, h2 = pos[b]
        draw_relation(ax, x1 + w1 / 2 + lx, y1, x2 - w2 / 2 - lx, y2 + ly)

    draw_relation(ax, 3.1, 9.0, 4.4, 9.0, '1:N')
    draw_relation(ax, 6.6, 9.0, 7.9, 9.0, '1:N')
    draw_relation(ax, 5.5, 8.35, 5.5, 9.0 - 0.68, 'parent')
    draw_relation(ax, 10.1, 9.0, 11.0, 9.5, '1:N')
    draw_relation(ax, 10.1, 8.7, 11.0, 8.0, '1:N')
    draw_relation(ax, 10.1, 8.4, 11.0, 6.5, '1:N')
    draw_relation(ax, 3.1, 8.35, 3.1, 7.15, '1:N')
    draw_relation(ax, 3.1, 6.5, 4.4, 6.5, 'N:1')
    draw_relation(ax, 6.6, 6.5, 7.9, 6.5, '1:N')
    draw_relation(ax, 6.6, 5.85, 6.6, 7.15, '1:N')
    draw_relation(ax, 10.1, 6.5, 10.1, 7.15, 'N:1')
    draw_relation(ax, 3.1, 4.55, 4.4, 4.0, '1:N')
    draw_relation(ax, 12.0, 3.45, 12.0, 2.85, '1:N')

    ax.text(8, 0.8,
            'Ky hieu: PK = Primary Key | FK = Foreign Key | 1:N = mot-nhieu',
            ha='center', fontsize=8, style='italic', color='#555')
    ax.set_title('Hinh 3.1: So do quan he thuc the (ERD)', fontsize=12, fontweight='bold', pad=12)
    return save_fig('erd_diagram.png', fig)


def activity_order():
    fig, ax = plt.subplots(figsize=(8, 14))
    ax.set_xlim(0, 8)
    ax.set_ylim(0, 14)
    ax.axis('off')

    def node(x, y, text, shape='rect', w=2.8, h=0.55):
        if shape == 'start':
            ax.add_patch(Ellipse((x, y), 0.35, 0.22, fc='#1F4E79', ec='#1F4E79'))
        elif shape == 'end':
            ax.add_patch(Ellipse((x, y), 0.35, 0.22, fc='white', ec='#1F4E79', lw=2))
            ax.add_patch(Ellipse((x, y), 0.22, 0.14, fc='#1F4E79', ec='#1F4E79'))
        elif shape == 'diamond':
            d = 0.45
            ax.add_patch(plt.Polygon([(x, y + d), (x + d * 1.3, y), (x, y - d), (x - d * 1.3, y)],
                                     closed=True, fc='#FFF2CC', ec='#BF9000', lw=1.2))
            ax.text(x, y, text, ha='center', va='center', fontsize=7, wrap=True)
        else:
            ax.add_patch(FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle='round,pad=0.02',
                                        fc='#E8F4FD', ec='#1F4E79', lw=1.2))
            ax.text(x, y, text, ha='center', va='center', fontsize=7.5)

    def arrow(x1, y1, x2, y2, label=''):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='->', color='#333', lw=1))
        if label:
            ax.text((x1 + x2) / 2 + 0.15, (y1 + y2) / 2, label, fontsize=6.5, color='#C00000')

    cx = 4.0
    steps = [
        (13.2, 'start', ''),
        (12.6, 'rect', 'Chon san pham\n(mau sac, dung luong)'),
        (11.7, 'rect', 'Them vao gio hang\n(snapshot gia KM)'),
        (10.8, 'diamond', 'Da dang\nnhap?'),
        (10.0, 'rect', 'Dang nhap / Dang ky'),
        (9.1, 'rect', 'Vao trang Checkout'),
        (8.2, 'rect', 'Nhap dia chi giao hang'),
        (7.3, 'rect', 'Chon PT thanh toan\n(COD/Bank/MoMo/ZaloPay)'),
        (6.4, 'rect', 'POST /api/orders'),
        (5.5, 'rect', 'BEGIN TRANSACTION'),
        (4.6, 'diamond', 'Du ton\nkho?'),
        (3.7, 'rect', 'INSERT orders\n+ order_items'),
        (2.8, 'rect', 'UPDATE stock\n(giam ton kho)'),
        (1.9, 'rect', 'DELETE carts\n+ COMMIT'),
        (1.0, 'diamond', 'PT tra\ntruoc?'),
        (0.35, 'end', ''),
    ]

    for y, shape, text in steps:
        node(cx, y, text, shape)

    ys = [s[0] for s in steps]
    for i in range(len(ys) - 1):
        arrow(cx, ys[i] - 0.15, cx, ys[i + 1] + 0.15)

    arrow(cx, 10.8 - 0.5, cx, 10.0 + 0.3, 'Khong')
    ax.text(5.3, 10.4, 'Co', fontsize=6.5, color='#007000')
    arrow(cx + 0.1, 10.8 - 0.1, cx + 0.1, 9.1 + 0.3)

    arrow(cx, 4.6 - 0.5, 6.2, 5.5 + 0.3, 'Khong')
    node(6.5, 5.5, 'ROLLBACK\nThong bao loi', 'rect', w=2.2)
    arrow(6.5, 5.2, 6.5, 13.0)
    arrow(6.5, 13.0, cx + 1.4, 13.0)
    arrow(cx + 1.4, 13.0, cx + 1.4, 12.6)
    arrow(cx + 1.4, 12.6, cx + 1.4, 12.6)

    arrow(cx - 0.5, 1.0, 1.5, 1.0, 'COD')
    node(1.2, 1.0, 'Hien thi\nxac nhan don', 'rect', w=2.0, h=0.5)
    arrow(cx + 0.5, 1.0, 6.5, 1.0, 'Co')
    node(6.8, 1.0, 'Hien thi QR /\nThong tin TT', 'rect', w=2.0, h=0.5)

    ax.set_title('Hinh 3.9: So do hoat dong - Luong dat hang (Checkout)', fontsize=11, fontweight='bold', pad=10)
    return save_fig('activity_order.png', fig)


def generate_all():
    paths = [
        erd_diagram(),
        use_case_overall(),
        use_case_customer(),
        use_case_admin(),
        sequence_login(),
        sequence_order(),
        sequence_chatbot(),
        sequence_payment(),
        activity_order(),
    ]
    print('Generated', len(paths), 'diagrams in', DIAGRAM_DIR)
    return paths


if __name__ == '__main__':
    generate_all()
