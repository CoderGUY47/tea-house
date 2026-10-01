// ==========================================================================
// The Tea House — Main Engine
// Navigation, Product Slider, Cart Manager, Checkout & Payment Processor
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ------------------------------------------------------------------------
  // 1. Navigation & Mobile Menu
  // ------------------------------------------------------------------------
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  menuToggle?.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });

  // Highlight active link based on current page
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  navLinks?.querySelectorAll("a").forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // ------------------------------------------------------------------------
  // 2. Cart System & State (Stored in localStorage for multi-page persistence)
  // ------------------------------------------------------------------------
  const CART_STORAGE_KEY = "theTeaHouseCart";
  const PROMO_STORAGE_KEY = "theTeaHousePromo";

  let cart = [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    cart = saved ? JSON.parse(saved) : [];
  } catch (e) {
    cart = [];
  }

  let promoCode = localStorage.getItem(PROMO_STORAGE_KEY) || null;

  const cartTrigger = document.getElementById("cartTrigger");
  const cartBadge = document.getElementById("cartBadge");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const cartCloseBtn = document.getElementById("cartCloseBtn");
  const cartItemsList = document.getElementById("cartItemsList");
  const cartHeaderCount = document.getElementById("cartHeaderCount");
  const shippingRemaining = document.getElementById("shippingRemaining");
  const shippingPercent = document.getElementById("shippingPercent");
  const shippingBarFill = document.getElementById("shippingBarFill");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartDiscountRow = document.getElementById("cartDiscountRow");
  const cartDiscount = document.getElementById("cartDiscount");
  const cartDelivery = document.getElementById("cartDelivery");
  const cartTotal = document.getElementById("cartTotal");
  const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
  const promoInput = document.getElementById("promoInput");
  const promoApplyBtn = document.getElementById("promoApplyBtn");
  const promoNotice = document.getElementById("promoNotice");

  const toast = document.querySelector(".toast");
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.innerHTML = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2400);
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Cart save failed", e);
    }
    renderCart();
  }

  function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const hasDiscount = promoCode && promoCode.toUpperCase() === "SLOWTEA10";
    const discount = hasDiscount ? Math.round(subtotal * 0.1) : 0;
    // Free delivery over ৳1,500; ৳60 otherwise (or ৳0 if cart is empty)
    const delivery = subtotal >= 1500 || subtotal === 0 ? 0 : 60;
    const total = Math.max(0, subtotal - discount + delivery);
    const progress = subtotal >= 1500 ? 100 : Math.min(100, Math.round((subtotal / 1500) * 100));
    const remaining = Math.max(0, 1500 - subtotal);

    return { subtotal, discount, delivery, total, progress, remaining, hasDiscount };
  }

  function renderCart() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Update Badges
    if (cartBadge) {
      cartBadge.textContent = String(totalCount);
      cartBadge.classList.add("bump");
      setTimeout(() => cartBadge.classList.remove("bump"), 250);
    }
    if (cartHeaderCount) {
      cartHeaderCount.textContent = `${totalCount} ${totalCount === 1 ? "item" : "items"}`;
    }

    const { subtotal, discount, delivery, total, progress, remaining, hasDiscount } = calculateTotals();

    // Free delivery banner
    if (shippingRemaining && shippingPercent && shippingBarFill) {
      if (subtotal >= 1500) {
        shippingRemaining.innerHTML = "Free Delivery Unlocked!";
        shippingPercent.textContent = "100%";
        shippingBarFill.style.width = "100%";
      } else {
        shippingRemaining.innerHTML = `<i class="fa-solid fa-bangladeshi-taka-sign"></i> ${remaining.toLocaleString()}`;
        shippingPercent.textContent = `${progress}%`;
        shippingBarFill.style.width = `${progress}%`;
      }
    }

    // Render items list
    if (cartItemsList) {
      if (cart.length === 0) {
        cartItemsList.innerHTML = `
          <div class="cart-empty-view">
            <div class="cart-empty-icon"><i class="fi fi-rr-mug-hot"></i></div>
            <h4>Your tea bag is empty</h4>
            <p>Fill it with single-origin harvests and botanicals made for slow moments.</p>
            <a href="collection.html" class="btn-browse" id="emptyBrowseBtn">
              <span>Explore Collection</span>
              <i class="fi fi-rr-arrow-right"></i>
            </a>
          </div>
        `;
        document.getElementById("emptyBrowseBtn")?.addEventListener("click", () => {
          closeCartDrawer();
        });
      } else {
        cartItemsList.innerHTML = cart.map(item => `
          <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-thumb">
              <img src="${item.image}" alt="${item.name}" loading="lazy" />
            </div>
            <div class="cart-item-info">
              <span class="cart-item-type">${item.type || "Tea"}</span>
              <h4 class="cart-item-title">${item.name}</h4>
              <span class="cart-item-price"><i class="fa-solid fa-bangladeshi-taka-sign"></i> ${Number(item.price).toLocaleString()}</span>
            </div>
            <div class="cart-item-actions">
              <div class="qty-stepper">
                <button class="qty-btn dec" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn inc" data-id="${item.id}" aria-label="Increase quantity">+</button>
              </div>
              <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove item">
                <i class="fi fi-rr-trash"></i>
              </button>
            </div>
          </div>
        `).join("");

        // Attach item quantity stepper events
        cartItemsList.querySelectorAll(".qty-btn.inc").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            updateCartQuantity(id, 1);
          });
        });
        cartItemsList.querySelectorAll(".qty-btn.dec").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            updateCartQuantity(id, -1);
          });
        });
        cartItemsList.querySelectorAll(".cart-item-remove").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            removeFromCart(id);
          });
        });
      }
    }

    // Promo notice
    if (promoNotice) {
      if (hasDiscount) {
        promoNotice.style.display = "block";
        promoNotice.innerHTML = `
          <div class="promo-tag">
            <span><strong>SLOWTEA10</strong> applied (10% off)</span>
            <button id="removePromoBtn" title="Remove promo">&times;</button>
          </div>
        `;
        document.getElementById("removePromoBtn")?.addEventListener("click", () => {
          promoCode = null;
          localStorage.removeItem(PROMO_STORAGE_KEY);
          renderCart();
          showToast("Promo code removed.");
        });
      } else {
        promoNotice.style.display = "none";
      }
    }

    // Summary totals
    if (cartSubtotal) cartSubtotal.innerHTML = `<i class="fa-solid fa-bangladeshi-taka-sign"></i> ${subtotal.toLocaleString()}`;
    if (cartDiscountRow && cartDiscount) {
      if (hasDiscount && discount > 0) {
        cartDiscountRow.style.display = "flex";
        cartDiscount.innerHTML = `- <i class="fa-solid fa-bangladeshi-taka-sign"></i> ${discount.toLocaleString()}`;
      } else {
        cartDiscountRow.style.display = "none";
      }
    }
    if (cartDelivery) {
      if (subtotal === 0) {
        cartDelivery.innerHTML = `<i class="fa-solid fa-bangladeshi-taka-sign"></i> 0`;
      } else if (delivery === 0) {
        cartDelivery.innerHTML = `<span style="color:#235831; font-weight:700;">FREE</span>`;
      } else {
        cartDelivery.innerHTML = `<i class="fa-solid fa-bangladeshi-taka-sign"></i> ${delivery}`;
      }
    }
    if (cartTotal) cartTotal.innerHTML = `<i class="fa-solid fa-bangladeshi-taka-sign"></i> ${total.toLocaleString()}`;

    // Enable / disable checkout button
    if (cartCheckoutBtn) {
      cartCheckoutBtn.disabled = cart.length === 0;
    }

    // Update checkout modal summary if modal is open
    updateCheckoutSummary();
  }

  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        type: product.type || "Artisanal Tea",
        quantity: 1
      });
    }
    saveCart();
    showToast(`<strong>${product.name}</strong> added to your tea bag.`);
  }

  function updateCartQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== id);
    }
    saveCart();
  }

  function removeFromCart(id) {
    const item = cart.find(i => i.id === id);
    cart = cart.filter(i => i.id !== id);
    saveCart();
    if (item) {
      showToast(`${item.name} removed from your tea bag.`);
    }
  }

  // Open & Close Cart Drawer
  function openCartDrawer() {
    cartDrawer?.classList.add("open");
    cartBackdrop?.classList.add("open");
    cartDrawer?.setAttribute("aria-hidden", "false");
    cartBackdrop?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeCartDrawer() {
    cartDrawer?.classList.remove("open");
    cartBackdrop?.classList.remove("open");
    cartDrawer?.setAttribute("aria-hidden", "true");
    cartBackdrop?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  cartTrigger?.addEventListener("click", openCartDrawer);
  cartCloseBtn?.addEventListener("click", closeCartDrawer);
  cartBackdrop?.addEventListener("click", closeCartDrawer);

  // Apply promo code
  promoApplyBtn?.addEventListener("click", () => {
    const code = promoInput?.value.trim().toUpperCase();
    if (!code) return;
    if (code === "SLOWTEA10") {
      promoCode = code;
      localStorage.setItem(PROMO_STORAGE_KEY, code);
      promoInput.value = "";
      renderCart();
      showToast("🎉 Promo SLOWTEA10 applied: 10% discount on teas!");
    } else {
      showToast("Invalid code. Try code <strong>SLOWTEA10</strong>.");
    }
  });

  // Global Add to Cart triggers
  document.querySelectorAll(".quick-add, .add-to-cart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".product-card") || btn.closest("[data-id]");
      if (!card) return;
      const product = {
        id: card.dataset.id || "tea-" + card.querySelector("h3").textContent.toLowerCase().replace(/\s+/g, "-"),
        name: card.dataset.name || card.querySelector("h3").textContent,
        price: card.dataset.price || (card.querySelector("strong")?.textContent.replace(/[^0-9]/g, "") || "600"),
        image: card.dataset.image || card.querySelector("img")?.src,
        type: card.dataset.type || card.querySelector(".product-type")?.textContent || "Tea"
      };
      addToCart(product);
    });
  });

  // ------------------------------------------------------------------------
  // 3. Checkout Modal & Payment Processor
  // ------------------------------------------------------------------------
  const checkoutModalBackdrop = document.getElementById("checkoutModalBackdrop");
  const checkoutCloseBtn = document.getElementById("checkoutCloseBtn");
  const checkoutForm = document.getElementById("checkoutForm");
  const confirmOrderBtn = document.getElementById("confirmOrderBtn");
  const confirmOrderBtnText = document.getElementById("confirmOrderBtnText");

  const subformBkash = document.getElementById("subformBkash");
  const subformNagad = document.getElementById("subformNagad");
  const subformCard = document.getElementById("subformCard");

  const checkoutItemCount = document.getElementById("checkoutItemCount");
  const checkoutSubtotal = document.getElementById("checkoutSubtotal");
  const checkoutDiscountRow = document.getElementById("checkoutDiscountRow");
  const checkoutDiscount = document.getElementById("checkoutDiscount");
  const checkoutDelivery = document.getElementById("checkoutDelivery");
  const checkoutTotal = document.getElementById("checkoutTotal");

  // Order Confirmation Elements
  const orderModalBackdrop = document.getElementById("orderModalBackdrop");
  const receiptOrderNum = document.getElementById("receiptOrderNum");
  const receiptEta = document.getElementById("receiptEta");
  const receiptCustomer = document.getElementById("receiptCustomer");
  const receiptPayment = document.getElementById("receiptPayment");
  const receiptItems = document.getElementById("receiptItems");
  const receiptTotal = document.getElementById("receiptTotal");
  const receiptPrintBtn = document.getElementById("receiptPrintBtn");
  const receiptDoneBtn = document.getElementById("receiptDoneBtn");

  function openCheckoutModal() {
    if (cart.length === 0) {
      showToast("Your tea bag is empty. Please add tea first.");
      return;
    }
    closeCartDrawer();
    updateCheckoutSummary();
    checkoutModalBackdrop?.classList.add("open");
    checkoutModalBackdrop?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeCheckoutModal() {
    checkoutModalBackdrop?.classList.remove("open");
    checkoutModalBackdrop?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  cartCheckoutBtn?.addEventListener("click", openCheckoutModal);
  checkoutCloseBtn?.addEventListener("click", closeCheckoutModal);

  // Switch Payment Subforms
  const paymentRadios = document.querySelectorAll("input[name='paymentMethod']");
  paymentRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      document.querySelectorAll(".payment-card-option").forEach(lbl => lbl.classList.remove("selected"));
      radio.closest(".payment-card-option")?.classList.add("selected");

      const method = radio.value;
      if (subformBkash) subformBkash.style.display = method === "bkash" ? "block" : "none";
      if (subformNagad) subformNagad.style.display = method === "nagad" ? "block" : "none";
      if (subformCard) subformCard.style.display = method === "card" ? "block" : "none";
    });
  });

  function updateCheckoutSummary() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const { subtotal, discount, delivery, total, hasDiscount } = calculateTotals();

    if (checkoutItemCount) checkoutItemCount.textContent = `${totalCount} ${totalCount === 1 ? "item" : "items"}`;
    if (checkoutSubtotal) checkoutSubtotal.innerHTML = `<i class="fa-solid fa-bangladeshi-taka-sign"></i> ${subtotal.toLocaleString()}`;
    if (checkoutDiscountRow && checkoutDiscount) {
      if (hasDiscount && discount > 0) {
        checkoutDiscountRow.style.display = "flex";
        checkoutDiscount.innerHTML = `- <i class="fa-solid fa-bangladeshi-taka-sign"></i> ${discount.toLocaleString()}`;
      } else {
        checkoutDiscountRow.style.display = "none";
      }
    }
    if (checkoutDelivery) {
      if (delivery === 0) {
        checkoutDelivery.innerHTML = `<span style="color:#235831; font-weight:700;">FREE</span>`;
      } else {
        checkoutDelivery.innerHTML = `<i class="fa-solid fa-bangladeshi-taka-sign"></i> ${delivery}`;
      }
    }
    if (checkoutTotal) checkoutTotal.innerHTML = `<i class="fa-solid fa-bangladeshi-taka-sign"></i> ${total.toLocaleString()}`;
  }

  // Handle Checkout Submission
  checkoutForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("custName")?.value.trim();
    const phone = document.getElementById("custPhone")?.value.trim();
    const city = document.getElementById("custCity")?.value;
    const address = document.getElementById("custAddress")?.value.trim();
    const notes = document.getElementById("custNotes")?.value.trim();
    const selectedPayRadio = document.querySelector("input[name='paymentMethod']:checked");
    const method = selectedPayRadio ? selectedPayRadio.value : "cod";

    // Validations
    if (!name || name.length < 2) {
      showToast("Please enter your full recipient name.");
      return;
    }
    if (!phone || phone.length < 10) {
      showToast("Please enter a valid contact phone number.");
      return;
    }
    if (!address || address.length < 5) {
      showToast("Please provide your complete delivery street address.");
      return;
    }

    if (method === "bkash") {
      const bkashNum = document.getElementById("bkashSender")?.value.trim();
      const bkashTrx = document.getElementById("bkashTrx")?.value.trim();
      if (!bkashNum || !bkashTrx) {
        showToast("Please enter your bKash mobile number and Transaction ID (TrxID).");
        return;
      }
    } else if (method === "nagad") {
      const nagadNum = document.getElementById("nagadSender")?.value.trim();
      const nagadTrx = document.getElementById("nagadTrx")?.value.trim();
      if (!nagadNum || !nagadTrx) {
        showToast("Please enter your Nagad number and Transaction ID (TrxID).");
        return;
      }
    } else if (method === "card") {
      const cardNum = document.getElementById("cardNumber")?.value.trim();
      const cardExpiry = document.getElementById("cardExpiry")?.value.trim();
      const cardCvc = document.getElementById("cardCvc")?.value.trim();
      if (!cardNum || !cardExpiry || !cardCvc) {
        showToast("Please complete your card details for payment verification.");
        return;
      }
    }

    // Process Order (simulate realistic confirmation)
    if (confirmOrderBtn && confirmOrderBtnText) {
      confirmOrderBtn.disabled = true;
      confirmOrderBtnText.textContent = "Verifying & Placing Order...";
    }

    setTimeout(() => {
      const orderId = "TH-" + Math.floor(10000 + Math.random() * 90000);
      const { total } = calculateTotals();

      // Populate Receipt Modal
      if (receiptOrderNum) receiptOrderNum.textContent = `#${orderId}`;
      if (receiptCustomer) receiptCustomer.textContent = `${name} (${phone}) — ${address}, ${city}`;
      if (receiptEta) {
        receiptEta.textContent = city.includes("Dhaka (Inside City)") ? "Within 24 Hours (Eco-Courier)" : "Within 48 Hours";
      }

      let payStatusText = "Cash on Delivery";
      if (method === "bkash") payStatusText = "bKash (Verified Online)";
      if (method === "nagad") payStatusText = "Nagad (Verified Online)";
      if (method === "card") payStatusText = "Credit/Debit Card (Paid)";
      if (receiptPayment) receiptPayment.textContent = payStatusText;

      if (receiptItems) {
        receiptItems.innerHTML = cart.map(item => `
          <div class="ticket-item-line">
            <span>${item.quantity} × ${item.name} (${item.type})</span>
            <strong><i class="fa-solid fa-bangladeshi-taka-sign"></i> ${(Number(item.price) * item.quantity).toLocaleString()}</strong>
          </div>
        `).join("");
      }
      if (receiptTotal) receiptTotal.innerHTML = `<i class="fa-solid fa-bangladeshi-taka-sign"></i> ${total.toLocaleString()}`;

      // Clear Cart State
      cart = [];
      promoCode = null;
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(PROMO_STORAGE_KEY);
      renderCart();

      // Reset button
      if (confirmOrderBtn && confirmOrderBtnText) {
        confirmOrderBtn.disabled = false;
        confirmOrderBtnText.textContent = "Confirm Order";
      }
      checkoutForm.reset();

      // Switch modals
      closeCheckoutModal();
      orderModalBackdrop?.classList.add("open");
      orderModalBackdrop?.setAttribute("aria-hidden", "false");
    }, 900);
  });

  receiptPrintBtn?.addEventListener("click", () => {
    window.print();
  });

  receiptDoneBtn?.addEventListener("click", () => {
    orderModalBackdrop?.classList.remove("open");
    orderModalBackdrop?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  });

  // Close modals on Escape key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCartDrawer();
      closeCheckoutModal();
      orderModalBackdrop?.classList.remove("open");
      document.body.style.overflow = "";
    }
  });

  // ------------------------------------------------------------------------
  // 4. Product Slider & Scroll-Trigger Pin Slider
  // ------------------------------------------------------------------------
  const collectionTrack = document.getElementById("collectionTrack");
  const productSlider = document.getElementById("productSlider");
  const collectionScrollBar = document.getElementById("collectionScrollBar");
  const sliderPrev = document.getElementById("sliderPrev");
  const sliderNext = document.getElementById("sliderNext");
  const filterButtons = document.querySelectorAll(".filter");
  const allCards = document.querySelectorAll(".product-card");

  function updateTrackHeight() {
    if (!collectionTrack || !productSlider) return;
    if (window.innerWidth < 981) {
      collectionTrack.style.height = "auto";
      return;
    }
    const maxScroll = productSlider.scrollWidth - productSlider.clientWidth;
    if (maxScroll <= 20) {
      collectionTrack.style.height = "100vh";
    } else {
      // 1.5x horizontal scroll travel distance for relaxed, deliberate pacing
      const scrollDistance = Math.max(maxScroll * 1.5, window.innerHeight * 1.6);
      collectionTrack.style.height = `${window.innerHeight + scrollDistance}px`;
    }
  }

  function updateSliderButtons() {
    if (!productSlider || !sliderPrev || !sliderNext) return;
    const scrollLeft = productSlider.scrollLeft;
    const maxScroll = productSlider.scrollWidth - productSlider.clientWidth;
    sliderPrev.disabled = scrollLeft <= 4;
    sliderNext.disabled = scrollLeft >= maxScroll - 4;
  }

  function handleCollectionScroll() {
    if (!collectionTrack || !productSlider) return;
    if (window.innerWidth < 981) return;

    const trackRect = collectionTrack.getBoundingClientRect();
    const trackTop = trackRect.top;
    const trackHeight = collectionTrack.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollDistance = trackHeight - viewportHeight;

    if (scrollDistance <= 0) return;

    // Pin progress: 0 when track top meets viewport top; 1 when scroll reaches end of track
    const progress = Math.min(Math.max(-trackTop / scrollDistance, 0), 1);
    const maxScroll = productSlider.scrollWidth - productSlider.clientWidth;

    if (maxScroll > 0) {
      productSlider.scrollLeft = progress * maxScroll;
    }

    if (collectionScrollBar) {
      collectionScrollBar.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    updateSliderButtons();
  }

  // Prev / Next button click handlers
  sliderPrev?.addEventListener("click", () => {
    if (!productSlider) return;
    const cardWidth = productSlider.querySelector(".product-card")?.offsetWidth || 300;
    if (window.innerWidth >= 981 && collectionTrack) {
      const scrollDistance = collectionTrack.offsetHeight - window.innerHeight;
      const maxScroll = productSlider.scrollWidth - productSlider.clientWidth;
      if (maxScroll > 0 && scrollDistance > 0) {
        const targetScrollLeft = Math.max(productSlider.scrollLeft - (cardWidth + 20), 0);
        const targetProgress = targetScrollLeft / maxScroll;
        const trackAbsoluteTop = window.scrollY + collectionTrack.getBoundingClientRect().top;
        const targetWindowY = trackAbsoluteTop + (targetProgress * scrollDistance);
        window.scrollTo({ top: targetWindowY, behavior: "smooth" });
        return;
      }
    }
    productSlider.scrollBy({ left: -(cardWidth + 20), behavior: "smooth" });
  });

  sliderNext?.addEventListener("click", () => {
    if (!productSlider) return;
    const cardWidth = productSlider.querySelector(".product-card")?.offsetWidth || 300;
    if (window.innerWidth >= 981 && collectionTrack) {
      const scrollDistance = collectionTrack.offsetHeight - window.innerHeight;
      const maxScroll = productSlider.scrollWidth - productSlider.clientWidth;
      if (maxScroll > 0 && scrollDistance > 0) {
        const targetScrollLeft = Math.min(productSlider.scrollLeft + cardWidth + 20, maxScroll);
        const targetProgress = targetScrollLeft / maxScroll;
        const trackAbsoluteTop = window.scrollY + collectionTrack.getBoundingClientRect().top;
        const targetWindowY = trackAbsoluteTop + (targetProgress * scrollDistance);
        window.scrollTo({ top: targetWindowY, behavior: "smooth" });
        return;
      }
    }
    productSlider.scrollBy({ left: cardWidth + 20, behavior: "smooth" });
  });

  productSlider?.addEventListener("scroll", updateSliderButtons, { passive: true });

  // Category Filtering
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter || "all";
      allCards.forEach(card => {
        const cat = card.dataset.category;
        const match = filter === "all" || cat === filter;
        card.style.display = match ? "" : "none";
      });

      if (collectionTrack && window.innerWidth >= 981) {
        const trackRect = collectionTrack.getBoundingClientRect();
        if (trackRect.top < 0 && trackRect.bottom > 0) {
          const trackAbsoluteTop = window.scrollY + trackRect.top;
          window.scrollTo({ top: trackAbsoluteTop, behavior: "smooth" });
        }
      }

      setTimeout(() => {
        updateTrackHeight();
        if (productSlider) productSlider.scrollLeft = 0;
        if (collectionScrollBar) collectionScrollBar.style.width = "0%";
        updateSliderButtons();
      }, 50);
    });
  });

  window.addEventListener("scroll", handleCollectionScroll, { passive: true });
  window.addEventListener("resize", () => {
    updateTrackHeight();
    handleCollectionScroll();
  }, { passive: true });

  // Initial calculation
  setTimeout(() => {
    updateTrackHeight();
    handleCollectionScroll();
    updateSliderButtons();
  }, 100);

  // ------------------------------------------------------------------------
  // 5. Lightbox for Gallery (used in gallery.html and index.html if present)
  // ------------------------------------------------------------------------
  const galleryFigures = document.querySelectorAll(".gallery-grid figure");
  if (galleryFigures.length > 0) {
    let lightbox = document.getElementById("lightboxModal");
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.id = "lightboxModal";
      lightbox.className = "lightbox-modal";
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <button class="lightbox-close" id="lightboxClose" aria-label="Close image">&times;</button>
          <img id="lightboxImg" src="" alt="" />
          <div class="lightbox-caption" id="lightboxCap"></div>
        </div>
      `;
      document.body.appendChild(lightbox);

      const closeBtn = document.getElementById("lightboxClose");
      const closeLightbox = () => {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
      };
      closeBtn?.addEventListener("click", closeLightbox);
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
      });
    }

    const lbImg = document.getElementById("lightboxImg");
    const lbCap = document.getElementById("lightboxCap");

    galleryFigures.forEach(fig => {
      fig.style.cursor = "zoom-in";
      fig.addEventListener("click", () => {
        const img = fig.querySelector("img");
        const cap = fig.querySelector("figcaption")?.textContent || img?.alt || "";
        if (img && lbImg && lbCap) {
          lbImg.src = img.src;
          lbImg.alt = cap;
          lbCap.textContent = cap;
          lightbox.classList.add("open");
          lightbox.setAttribute("aria-hidden", "false");
        }
      });
    });
  }

  // ------------------------------------------------------------------------
  // 6. Newsletters (Main & Footer)
  // ------------------------------------------------------------------------
  document.querySelectorAll(".newsletter-form, .footer-newsletter-form").forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type='email']");
      const email = input ? input.value.trim() : "";
      if (!email) return;
      showToast("You're on the dispatch list. Welcome to slower days.");
      form.reset();
    });
  });

  // ------------------------------------------------------------------------
  // 7. Scroll Reveals & Header Stuck State
  // ------------------------------------------------------------------------
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

  const header = document.querySelector(".site-header");
  const bar = document.querySelector(".progress");
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle("stuck", y > 60);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Initial cart render
  renderCart();
});
