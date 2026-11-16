
const API_BASE = "https://e-com-assignment-xxxx.onrender.com/api";

const DEMO = [
    {
        _id: "p1",
        name: "Everyday Ceramic Set",
        price: 850,
        category: "Home",
        description: "A clean, timeless ceramic set made for everyday moments.",
        image: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=900",
        stock: 12
    },
    {
        _id: "p2",
        name: "Minimal Desk Lamp",
        price: 1450,
        category: "Living",
        description: "A simple statement lamp with a warm, calming glow.",
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900",
        stock: 8
    },
    {
        _id: "p3",
        name: "Canvas Weekend Bag",
        price: 1200,
        category: "Accessories",
        description: "A versatile everyday carryall with a practical silhouette.",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900",
        stock: 15
    },
    {
        _id: "p4",
        name: "Natural Skincare Kit",
        price: 980,
        category: "Beauty",
        description: "A thoughtful daily care set for a simple routine.",
        image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=900",
        stock: 10
    }
];

let products = [...DEMO];

let cart = JSON.parse(localStorage.getItem("meridian_cart") || "[]");

let orders = JSON.parse(localStorage.getItem("meridian_orders") || "[]");

let token = localStorage.getItem("meridian_token") || "";

let user = JSON.parse(localStorage.getItem("meridian_user") || "null");

const $ = s => document.querySelector(s);

const money = n => "ETB " + Number(n || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2
});

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}[c]));

function toast(s) {
    let t = $("#toast");

    t.textContent = s;
    t.classList.add("show");

    setTimeout(() => t.classList.remove("show"), 2500);
}

function pic(p) {
    return p.image
        ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">`
        : "◇";
}

function saveCart() {
    localStorage.setItem("meridian_cart", JSON.stringify(cart));

    $("#cartCount").textContent = cart.reduce((n, x) => n + x.qty, 0);
}

function card(p) {
    return `
        <article class="card">
            <div class="photo" data-open="${esc(p._id)}">
                ${pic(p)}
            </div>

            <div class="card-info">
                <span class="category">${esc(p.category)}</span>

                <h3>${esc(p.name)}</h3>

                <div class="card-bottom">
                    <b class="price">${money(p.price)}</b>

                    <button class="small" data-add="${esc(p._id)}">
                        Add to bag
                    </button>
                </div>
            </div>
        </article>
    `;
}

function renderShop() {
    let term = $("#search").value.toLowerCase();
    let cat = $("#category").value;
    let sort = $("#sort").value;

    let a = products.filter(p =>
        (p.name + " " + p.category + " " + p.description)
            .toLowerCase()
            .includes(term) &&
        (cat === "all" || p.category === cat)
    );

    if (sort === "low") {
        a.sort((x, y) => x.price - y.price);
    }

    if (sort === "high") {
        a.sort((x, y) => y.price - x.price);
    }

    if (sort === "name") {
        a.sort((x, y) => x.name.localeCompare(y.name));
    }

    $("#listing").innerHTML = a.map(card).join("") ||
        '<div class="empty">No matching products.</div>';
}

function renderProducts() {
    let old = $("#category").value;

    let cats = [...new Set(products.map(p => p.category))];

    $("#category").innerHTML =
        '<option value="all">All categories</option>' +
        cats.map(c => `<option>${esc(c)}</option>`).join("");

    $("#category").value = cats.includes(old) ? old : "all";

    $("#featured").innerHTML = products.slice(0, 4).map(card).join("");

    renderShop();
}

function page() {
    let id = location.hash.slice(1).split("?")[0] || "home";

    document.querySelectorAll(".page").forEach(x =>
        x.classList.toggle("hidden", x.id !== id)
    );

    $("#nav").classList.remove("open");

    if (id === "product") renderProduct();
    if (id === "cart") renderCart();
    if (id === "checkout") renderTotal();
    if (id === "orders") renderOrders();
    if (id === "admin") renderAdmin();
    if (id === "account") accountStatus();

    window.scrollTo(0, 0);
}

function add(id, n = 1) {
    let p = products.find(x => String(x._id) === String(id));

    if (!p) return;

    let i = cart.find(x => String(x.productId) === String(id));

    if (i) {
        i.qty += n;
    } else {
        cart.push({
            productId: id,
            qty: n
        });
    }

    saveCart();

    toast("Added to your bag.");
}

function renderProduct() {
    let id = new URLSearchParams(location.hash.split("?")[1] || "").get("id");

    let p = products.find(x => String(x._id) === id);

    $("#productView").innerHTML = p
        ? `
            <div class="detail">
                <div class="detail-photo">
                    ${pic(p)}
                </div>

                <div>
                    <small>${esc(p.category)}</small>

                    <h1>${esc(p.name)}</h1>

                    <h2>${money(p.price)}</h2>

                    <p class="muted">${esc(p.description)}</p>

                    <p class="muted">
                        Stock: ${p.stock ?? "—"}
                    </p>

                    <input
                        class="quantity"
                        id="qty"
                        type="number"
                        min="1"
                        value="1"
                    >

                    <button class="btn" data-add="${esc(p._id)}" id="detailAdd">
                        Add to bag
                    </button>

                    <p>
                        <a href="#shop">← Back to shop</a>
                    </p>
                </div>
            </div>
        `
        : '<div class="empty">Product not found. <a href="#shop">Back to shop</a></div>';
}

function renderCart() {
    if (!cart.length) {
        $("#cartView").innerHTML =
            '<div class="empty">Your bag is empty. <a href="#shop">Explore the shop →</a></div>';

        return;
    }

    let total = 0;

    let html = cart.map(i => {
        let p = products.find(x => String(x._id) === String(i.productId));

        if (!p) return "";

        total += p.price * i.qty;

        return `
            <div class="row">
                <div>
                    ${pic(p)}
                </div>

                <div>
                    <h3>${esc(p.name)}</h3>

                    <p>${money(p.price)} each</p>

                    <button class="small" data-step="${esc(p._id)}" data-n="-1">
                        −
                    </button>

                    ${i.qty}

                    <button class="small" data-step="${esc(p._id)}" data-n="1">
                        +
                    </button>
                </div>

                <b>${money(p.price * i.qty)}</b>

                <button class="small remove" data-remove="${esc(p._id)}">
                    Remove
                </button>
            </div>
        `;
    }).join("");

    $("#cartView").innerHTML = `
        <div class="list">
            ${html}

            <div class="summary">
                Subtotal

                <strong>${money(total)}</strong>

                <a class="btn" href="#checkout">
                    Continue to checkout →
                </a>
            </div>
        </div>
    `;
}

function total() {
    return cart.reduce((s, i) => {
        let p = products.find(x => String(x._id) === String(i.productId));

        return s + (p ? p.price * i.qty : 0);
    }, 0);
}

function renderTotal() {
    $("#checkoutTotal").innerHTML = `
        <div class="summary">
            Order total

            <strong>${money(total())}</strong>
        </div>
    `;
}

function accountStatus() {
    if (user) {
        $("#accountStatus").innerHTML = `
            <p>
                Signed in as
                <b>${esc(user.name || user.email)}</b>

                <button class="small" id="logout">
                    Sign out
                </button>
            </p>
        `;
    }
}

function renderOrders() {
    let a = orders.filter(o => !user || o.email === user.email);

    $("#orderList").innerHTML = a.length
        ? `
            <div class="list">
                ${a.map(o => `
                    <div class="admin-row">
                        <span>
                            <b>Order #${esc(o.id)}</b>

                            <br>

                            <small>
                                ${new Date(o.createdAt).toLocaleString()}
                            </small>
                        </span>

                        <b>${money(o.total)}</b>

                        <span>${esc(o.status)}</span>
                    </div>
                `).join("")}
            </div>
        `
        : '<div class="empty">No orders yet.</div>';
}

function renderAdmin() {
    $("#stats").innerHTML = [
        ["Products", products.length],
        ["Orders", orders.length],
        ["Revenue", money(orders.reduce((s, o) => s + o.total, 0))]
    ].map(x => `
        <div class="stat">
            <small>${x[0]}</small>
            <strong>${x[1]}</strong>
        </div>
    `).join("");

    $("#adminProducts").innerHTML = products.map(p => `
        <div class="admin-row">
            <span>
                <b>${esc(p.name)}</b>

                <br>

                <small>
                    ${esc(p.category)} · ${money(p.price)} · Stock ${p.stock ?? "—"}
                </small>
            </span>

            <button class="small" data-edit="${esc(p._id)}">
                Edit
            </button>

            <button class="small" data-delete="${esc(p._id)}">
                Delete
            </button>
        </div>
    `).join("");

    $("#adminOrders").innerHTML = orders.map(o => `
        <div class="admin-row">
            <span>
                <b>Order #${esc(o.id)}</b>

                <br>

                <small>
                    ${esc(o.name)} · ${money(o.total)}
                </small>
            </span>

            <select class="status" data-status="${esc(o.id)}">
                ${["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
                    .map(s => `
                        <option ${o.status === s ? "selected" : ""}>
                            ${s}
                        </option>
                    `).join("")}
            </select>
        </div>
    `).join("") || '<div class="empty">No orders yet.</div>';
}

async function api(path, opt = {}) {
    let h = {
        ...(opt.headers || {})
    };

    if (token) {
        h.Authorization = "Bearer " + token;
    }

    if (opt.body && !(opt.body instanceof FormData)) {
        h["Content-Type"] = "application/json";
    }

    let r = await fetch(API_BASE + path, {
        ...opt,
        headers: h
    });

    let d = await r.json().catch(() => ({
        message: "Server response error"
    }));

    if (!r.ok) {
        throw Error(d.message || "Request failed");
    }

    return d;
}

async function load() {
    try {
        let d = await api("/products");

        products = Array.isArray(d) ? d : (d.products || DEMO);

    } catch {
        products = [...DEMO];
    }

    renderProducts();

    page();
}

async function auth(form, kind) {
    let v = Object.fromEntries(new FormData(form));

    try {
        let d = await api("/auth/" + kind, {
            method: "POST",
            body: JSON.stringify(v)
        });

        token = d.token;

        user = d.user || {
            name: v.name,
            email: v.email
        };

        localStorage.setItem("meridian_token", token);

        localStorage.setItem("meridian_user", JSON.stringify(user));

        toast("Signed in successfully.");

        form.reset();

        accountStatus();

    } catch (e) {
        toast(e.message + " — check your backend.");
    }
}

$("#menuBtn").onclick = () =>
    $("#nav").classList.toggle("open");

$("#searchBtn").onclick = () => {
    location.hash = "#shop";

    setTimeout(() => $("#search").focus(), 50);
};

$("#search").oninput = renderShop;

$("#category").onchange = renderShop;

$("#sort").onchange = renderShop;

window.addEventListener("hashchange", page);

document.addEventListener("click", e => {

    let a = e.target.closest("[data-add]");

    if (a) {
        let n = a.id === "detailAdd"
            ? Math.max(1, Number($("#qty").value) || 1)
            : 1;

        add(a.dataset.add, n);
    }

    let op = e.target.closest("[data-open]");

    if (op) {
        location.hash = "#product?id=" + encodeURIComponent(op.dataset.open);
    }

    let rm = e.target.closest("[data-remove]");

    if (rm) {
        cart = cart.filter(i =>
            String(i.productId) !== String(rm.dataset.remove)
        );

        saveCart();

        renderCart();
    }

    let st = e.target.closest("[data-step]");

    if (st) {
        let i = cart.find(x =>
            String(x.productId) === String(st.dataset.step)
        );

        i.qty += Number(st.dataset.n);

        if (i.qty < 1) {
            cart = cart.filter(x => x !== i);
        }

        saveCart();

        renderCart();
    }

    let ed = e.target.closest("[data-edit]");

    if (ed) {
        let p = products.find(x =>
            String(x._id) === String(ed.dataset.edit)
        );

        let f = $("#productForm");

        for (let k of [
            "name",
            "price",
            "category",
            "description",
            "image",
            "stock"
        ]) {
            f.elements[k].value = p[k] ?? "";
        }

        f.elements.id.value = p._id;

        $("#formTitle").textContent = "Edit product";

        $("#cancelEdit").classList.remove("hidden");

        f.scrollIntoView({
            behavior: "smooth"
        });
    }

    let del = e.target.closest("[data-delete]");

    if (del && confirm("Delete this product?")) {
        products = products.filter(p =>
            String(p._id) !== String(del.dataset.delete)
        );

        renderProducts();

        renderAdmin();

        toast("Product removed in this preview.");
    }

    if (e.target.id === "logout") {
        token = "";

        user = null;

        localStorage.removeItem("meridian_token");

        localStorage.removeItem("meridian_user");

        accountStatus();

        toast("Signed out.");
    }

});

$("#login").onsubmit = e => {
    e.preventDefault();

    auth(e.currentTarget, "login");
};

$("#register").onsubmit = e => {
    e.preventDefault();

    auth(e.currentTarget, "register");
};

$("#checkoutForm").onsubmit = async e => {
    e.preventDefault();

    if (!cart.length) {
        toast("Your bag is empty.");

        return;
    }

    let v = Object.fromEntries(new FormData(e.currentTarget));

    let items = cart.map(i => ({
        product: i.productId,
        quantity: i.qty
    }));

    let payload = {
        ...v,
        items,
        total: total()
    };

    try {
        await api("/orders", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        toast("Order placed.");

    } catch {
        orders.unshift({
            id: String(Date.now()).slice(-7),
            ...v,
            items,
            total: total(),
            status: "Pending",
            createdAt: new Date().toISOString()
        });

        localStorage.setItem("meridian_orders", JSON.stringify(orders));

        toast("Demo order saved in this browser.");
    }

    cart = [];

    saveCart();

    e.currentTarget.reset();

    location.hash = "#orders";
};

function resetForm() {
    let f = $("#productForm");

    f.reset();

    f.elements.id.value = "";

    $("#formTitle").textContent = "Add a product";

    $("#cancelEdit").classList.add("hidden");
}

$("#cancelEdit").onclick = resetForm;

$("#productForm").onsubmit = async e => {
    e.preventDefault();

    let f = e.currentTarget;

    let d = new FormData(f);

    let id = d.get("id");

    let p = {
        name: d.get("name"),
        price: Number(d.get("price")),
        category: d.get("category"),
        description: d.get("description"),
        image: d.get("image"),
        stock: Number(d.get("stock"))
    };

    try {
        if (d.get("imageFile").size) {
            let fd = new FormData();

            Object.entries(p).forEach(([k, v]) => fd.append(k, v));

            fd.append("imageFile", d.get("imageFile"));

            let out = await api(
                id ? "/products/" + id : "/products",
                {
                    method: id ? "PUT" : "POST",
                    body: fd
                }
            );

            p = out.product || out;

        } else {
            let out = await api(
                id ? "/products/" + id : "/products",
                {
                    method: id ? "PUT" : "POST",
                    body: JSON.stringify(p)
                }
            );

            p = out.product || out;
        }

        p._id = p._id || id || "new-" + Date.now();

        products = id
            ? products.map(x => String(x._id) === String(id) ? p : x)
            : [p, ...products];

        toast("Product saved to backend.");

    } catch (err) {
        p._id = id || "local-" + Date.now();

        products = id
            ? products.map(x => String(x._id) === String(id) ? p : x)
            : [p, ...products];

        toast("Preview saved locally. Connect API for permanent storage.");
    }

    resetForm();

    renderProducts();

    renderAdmin();
};

$("#adminOrders").addEventListener("change", e => {

    if (!e.target.matches("[data-status]")) return;

    let o = orders.find(x =>
        String(x.id) === String(e.target.dataset.status)
    );

    if (o) {
        o.status = e.target.value;

        localStorage.setItem("meridian_orders", JSON.stringify(orders));

        toast("Status updated locally.");
    }

});

$("#year").textContent = new Date().getFullYear();

saveCart();

load();
