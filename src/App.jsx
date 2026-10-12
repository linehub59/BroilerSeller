
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  Store,
  PlusCircle,
  Package,
  LogOut,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { auth, db } from "./config/Firebase";
import "./index.css";

const emptyForm = {
  productName: "Dressed Broiler Chicken",
  pricePerKg: "",
  averageWeightKg: "",
  quantityAvailable: "",
  location: "",
  sellerPhone: "",
  imageUrl: "",
  description: "",
  deliveryAvailable: false,
  collectionAvailable: true,
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [listings, setListings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setListings([]);
      return;
    }

    const q = query(
      collection(db, "listings"),
      where("sellerId", "==", user.uid)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        data.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setListings(data);
      },
      (error) => {
        console.error(error);
        setMessage("Could not load listings. Check your Firestore rules.");
      }
    );
  }, [user]);

  async function handleAuth(event) {
    event.preventDefault();
    setMessage("");

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitListing(event) {
    event.preventDefault();
    if (!user) return;

    const price = Number(form.pricePerKg);
    const weight = Number(form.averageWeightKg);
    const quantity = Number(form.quantityAvailable);

    if (
      !Number.isFinite(price) || price <= 0 ||
      !Number.isFinite(weight) || weight <= 0 ||
      !Number.isInteger(quantity) || quantity <= 0
    ) {
      setMessage("Enter a valid price, weight and whole-number quantity.");
      return;
    }

    if (!form.location.trim() || !form.sellerPhone.trim()) {
      setMessage("Enter your location and WhatsApp phone number.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await addDoc(collection(db, "listings"), {
        productName: form.productName,
        pricePerKg: price,
        averageWeightKg: weight,
        quantityAvailable: quantity,
        location: form.location.trim(),
        sellerPhone: form.sellerPhone.trim(),
        imageUrl: form.imageUrl.trim(),
        description: form.description.trim(),
        deliveryAvailable: form.deliveryAvailable,
        collectionAvailable: form.collectionAvailable,
        sellerId: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setForm(emptyForm);
      setShowForm(false);
      setMessage("Listing submitted! It is waiting for admin approval.");
    } catch (error) {
      console.error(error);
      setMessage("Could not save listing. Check your Firebase setup and rules.");
    } finally {
      setSaving(false);
    }
  }

  async function removeListing(id) {
    const confirmed = window.confirm("Delete this listing?");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "listings", id));
      setMessage("Listing deleted.");
    } catch (error) {
      console.error(error);
      setMessage("Could not delete this listing.");
    }
  }

  if (!authReady) {
    return <main className="center">Loading Broiler Soko...</main>;
  }

  if (!user) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="brand-icon"><Store size={30} /></div>
          <h1>Broiler Soko</h1>
          <p className="muted">Seller portal · Sell more chicken</p>

          <form onSubmit={handleAuth}>
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />

            <button className="primary full" type="submit">
              {isRegister ? "Create seller account" : "Log in"}
            </button>
          </form>

          <p className="switch">
            {isRegister ? "Already registered?" : "New seller?"}{" "}
            <button
              className="text-button"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Log in" : "Create account"}
            </button>
          </p>

          {message && <p className="notice">{message}</p>}
        </div>
      </main>
    );
  }

  const pending = listings.filter((x) => x.status === "pending").length;
  const approved = listings.filter((x) => x.status === "approved").length;
  const rejected = listings.filter((x) => x.status === "rejected").length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Store size={24} /></div>
          <div>
            <strong>Broiler Soko</strong>
            <small>Seller dashboard</small>
          </div>
        </div>
        <button className="logout" onClick={() => signOut(auth)}>
          <LogOut size={17} /> <span>Log out</span>
        </button>
      </header>

      <main className="content">
        <section className="welcome">
          <div>
            <p className="eyebrow">SELLER CENTRE</p>
            <h1>Your chicken business, online.</h1>
            <p className="muted">
              Publish your stock and connect with potential buyers.
            </p>
          </div>
          <button className="primary" onClick={() => {
            setMessage("");
            setShowForm(!showForm);
          }}>
            <PlusCircle size={18} />
            {showForm ? "Close form" : "Add listing"}
          </button>
        </section>

        {message && <div className="notice">{message}</div>}

        <section className="stats">
          <div className="stat">
            <Package />
            <span>Total listings</span>
            <strong>{listings.length}</strong>
          </div>
          <div className="stat">
            <Clock />
            <span>Pending approval</span>
            <strong>{pending}</strong>
          </div>
          <div className="stat">
            <CheckCircle />
            <span>Approved</span>
            <strong>{approved}</strong>
          </div>
        </section>

        {showForm && (
          <section className="panel">
            <h2>List your dressed broilers</h2>
            <p className="muted">
              Provide accurate details. Your listing won't appear to buyers
              until the admin approves it.
            </p>

            <form className="listing-form" onSubmit={submitListing}>
              <label>Product name</label>
              <input
                value={form.productName}
                onChange={(e) => setForm({...form, productName: e.target.value})}
                required
              />

              <div className="form-grid">
                <div>
                  <label>Price per kg (KSh)</label>
                  <input
                    type="number" min="1" step="1"
                    value={form.pricePerKg}
                    onChange={(e) => setForm({...form, pricePerKg: e.target.value})}
                    placeholder="350" required
                  />
                </div>
                <div>
                  <label>Average weight (kg)</label>
                  <input
                    type="number" min="0.1" step="0.1"
                    value={form.averageWeightKg}
                    onChange={(e) => setForm({...form, averageWeightKg: e.target.value})}
                    placeholder="2" required
                  />
                </div>
                <div>
                  <label>Available birds</label>
                  <input
                    type="number" min="1" step="1"
                    value={form.quantityAvailable}
                    onChange={(e) => setForm({...form, quantityAvailable: e.target.value})}
                    placeholder="50" required
                  />
                </div>
                <div>
                  <label>Location / town</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({...form, location: e.target.value})}
                    placeholder="e.g. Machakos" required
                  />
                </div>
              </div>

              <label>WhatsApp phone number</label>
              <input
                type="tel"
                value={form.sellerPhone}
                onChange={(e) => setForm({...form, sellerPhone: e.target.value})}
                placeholder="2547XXXXXXXX" required
              />

              <label>Chicken image URL (optional)</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({...form, imageUrl: e.target.value})}
                placeholder="https://example.com/chicken.jpg"
              />

              <label>Description</label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Packaging, minimum order, freshness, delivery terms..."
              />

              <label className="check">
                <input
                  type="checkbox"
                  checked={form.deliveryAvailable}
                  onChange={(e) => setForm({...form, deliveryAvailable: e.target.checked})}
                />
                Delivery available
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={form.collectionAvailable}
                  onChange={(e) => setForm({...form, collectionAvailable: e.target.checked})}
                />
                Buyer can collect
              </label>

              <button className="primary full" disabled={saving}>
                {saving ? "Submitting..." : "Submit for approval"}
              </button>
            </form>
          </section>
        )}

        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>My listings</h2>
              <p className="muted">Track your products and approval status.</p>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="empty">
              <Package size={36} />
              <h3>No listings yet</h3>
              <p>Add your first dressed-chicken listing to get started.</p>
              <button className="primary" onClick={() => setShowForm(true)}>
                Add your first listing
              </button>
            </div>
          ) : (
            <div className="listing-list">
              {listings.map((item) => (
                <article className="listing" key={item.id}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} />
                  ) : (
                    <div className="placeholder"><Package size={28} /></div>
                  )}

                  <div className="listing-info">
                    <span className={`status ${item.status || "pending"}`}>
                      {item.status || "pending"}
                    </span>
                    <h3>{item.productName}</h3>
                    <p><MapPin size={14} /> {item.location}</p>
                    <strong>KSh {Number(item.pricePerKg).toLocaleString()} / kg</strong>
                    <small>
                      {item.quantityAvailable} birds · Avg. {item.averageWeightKg} kg
                    </small>
                    <small>
                      <Phone size={13} /> {item.sellerPhone}
                    </small>
                    {item.status === "rejected" && item.rejectionReason && (
                      <p className="rejection">
                        Reason: {item.rejectionReason}
                      </p>
                    )}
                  </div>

                  <button
                    className="delete"
                    onClick={() => removeListing(item.id)}
                    aria-label="Delete listing"
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              ))}
            </div>
          )}
          <p className="muted small">
            {rejected} rejected listing(s). Contact admin if you need clarification.
          </p>
        </section>

        <footer>Broiler Soko · Helping chicken sellers reach buyers</footer>
      </main>
    </div>
  );
}
