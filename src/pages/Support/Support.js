// =============================================================================
// CONTACT  —  Meghali's Silk, route `/support`
// =============================================================================
// The care desk, written as a page. The old screen opened with a fabricated
// scoreboard — "4.9 Rating · 10K+ Customers · 500+ Designs · 15+ Years" — none
// of which the store can evidence. It is gone. What stands in its place are the
// only three facts about the house that are attested elsewhere in this codebase
// (the About page's founding year, its artisan count and its award year), set
// as three quiet marks. Nothing on this page claims a rating, a customer count
// or a response time.
//
// FOUR MOVEMENTS
//   1. THE INVITATION — tracked eyebrow, a serif line, and the three marks.
//   2. THE CHANNELS   — Call / Email / WhatsApp as hairline cards. Every value
//      is a live tel: / mailto: / wa.me link resolved from constants, and a
//      channel whose URL is blank simply does not render.
//   3. THE LETTER     — the lead form in the Prompt 18/22 form language: tracked
//      caption labels over fields that ARE the hairline, calm errors, and a
//      state-driven success panel that swaps only the form.
//   4. THE RAIL       — the showroom, the journey, and the four things the shop
//      can stand behind.
//
// THE API CONTRACT IS UNCHANGED
//   `apiService.leads.createContact(formData)` still receives the full lead
//   shape — including the two fields the form never shows, `orderNumber` (blank
//   from this surface) and `category: "general"` — so a message written here
//   lands in Admin → Leads next to the seeded rows, with the same keys.
//
// HONESTY RULES OBSERVED HERE
//   • No rating, no customer count, no "average response in X hours". The one
//     availability statement on the page is SUPPORT_HOURS, which is also what
//     the Footer and the Help Centre print.
//   • The "Online" live-status badge is retired: nothing in this app knows
//     whether anyone is at the desk.
//   • Address, phone, email and the social handles all resolve from constants,
//     which now carry the same values as db.json `settings.store` / `.social`.
// =============================================================================
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import apiService from "../../services/api";
import {
  SUPPORT_HOURS,
  SOCIAL_LINKS,
  WHY_CHOOSE_US,
} from "../../utils/constants";
import { isEmailValid, isValidPhone } from "../../utils/helpers";
import styles from "./Support.module.css";

// ---- Inline icon set ------------------------------------------------------
// Hairline weight (1.3), stroke = currentColor, no fills — the same drawing
// language as the Profile index and the order ledger. Iconify's mdi glyphs are
// solid shapes and read as app furniture next to this page's type.
const Glyph = ({ name, size = 20, strokeWidth = 1.3 }) => {
  const paths = {
    phone: (
      <path d="M6.2 3.5h3l1.4 3.5-1.8 1.3a11.5 11.5 0 0 0 5.4 5.4l1.3-1.8 3.5 1.4v3a1.9 1.9 0 0 1-2.1 1.9A15.8 15.8 0 0 1 4.3 5.6 1.9 1.9 0 0 1 6.2 3.5Z" />
    ),
    mail: (
      <>
        <rect x="2.75" y="5" width="18.5" height="14" rx="1.5" />
        <path d="m3.4 6.2 8.6 6.3 8.6-6.3" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M20.4 11.7a8.4 8.4 0 0 1-12.4 7.4L3.6 20.4l1.4-4.3A8.4 8.4 0 1 1 20.4 11.7Z" />
        <path d="M9.3 8.8h.9l1 2.2-.8.9a6.2 6.2 0 0 0 2.7 2.7l.9-.8 2.2 1v.9c0 .7-.6 1.2-1.3 1.2a7.9 7.9 0 0 1-7.1-7.1c0-.6.5-1 1.1-1Z" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21.2s6.6-5.8 6.6-10.4a6.6 6.6 0 1 0-13.2 0C5.4 15.4 12 21.2 12 21.2Z" />
        <circle cx="12" cy="10.6" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.6" />
        <path d="M12 7.2V12l3.2 1.9" />
      </>
    ),
    arrow: (
      <>
        <path d="M7 17 17 7" />
        <path d="M9 7h8v8" />
      </>
    ),
    check: <path d="m5 12.6 4.6 4.6L19 6.8" />,
    instagram: (
      <>
        <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="16.9" cy="7.1" r="0.9" />
      </>
    ),
    facebook: (
      <path d="M14.6 21.2v-8h2.7l.5-3.2h-3.2V7.9c0-.9.3-1.5 1.6-1.5h1.7V3.5a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H8.5v3.2h2.7v8Z" />
    ),
    twitter: (
      <>
        <path d="M4.2 4.2 19.8 19.8" />
        <path d="M19.8 4.2 4.2 19.8" />
      </>
    ),
    youtube: (
      <>
        <rect x="2.8" y="5.6" width="18.4" height="12.8" rx="3.6" />
        <path d="m10.3 9.3 5.2 2.7-5.2 2.7Z" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] || null}
    </svg>
  );
};

// ---- The three marks ------------------------------------------------------
// What replaces the invented scoreboard. Each is a fact the About page already
// states in its own Journey / Impact blocks, so the two surfaces agree; none of
// it is derived from the API, and none of it is a performance claim.
const MARKS = [
  { value: "2010", label: "Founded in Kolkata" },
  { value: "50+", label: "Artisan partners" },
  { value: "2023", label: "National Handloom Award" },
];

// A message has to say something — the same floor the old form enforced.
const MESSAGE_MIN = 20;

// The three ways in, built from the store's own contact details (the admin's
// Settings > General). WhatsApp is only offered when a URL exists — an empty
// entry drops the card rather than printing a dead one.
const buildChannels = ({ phone, email, phoneHref, emailHref }) =>
  [
    {
      key: "call",
      glyph: "phone",
      label: "Call",
      value: phone,
      note: "Speak to the desk during showroom hours",
      href: phone ? phoneHref : "",
      external: false,
    },
    {
      key: "email",
      glyph: "mail",
      label: "Email",
      value: email,
      note: "For measurements, care and considered questions",
      href: email ? emailHref : "",
      external: false,
    },
    {
      key: "whatsapp",
      glyph: "whatsapp",
      label: "WhatsApp",
      value: "Start a chat",
      note: "Send a photograph of the piece you are asking about",
      href: SOCIAL_LINKS.WHATSAPP,
      external: true,
    },
  ].filter((channel) => !!channel.href);

// Follow our journey — the same filtered-by-URL rule the Footer uses.
const SOCIALS = [
  { key: "INSTAGRAM", glyph: "instagram", label: "Instagram" },
  { key: "FACEBOOK", glyph: "facebook", label: "Facebook" },
  { key: "TWITTER", glyph: "twitter", label: "Twitter" },
  { key: "YOUTUBE", glyph: "youtube", label: "YouTube" },
  { key: "WHATSAPP", glyph: "whatsapp", label: "WhatsApp" },
].filter((social) => !!SOCIAL_LINKS[social.key]);

const EMPTY_LEAD = {
  name: "",
  email: "",
  phone: "",
  // Never shown on this surface, always sent: the Admin → Leads table and the
  // seeded rows both expect them.
  orderNumber: "",
  category: "general",
  subject: "",
  message: "",
};

const Support = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  // Phone, email and the showroom address are whatever the admin last saved.
  const {
    email: supportEmail,
    phone: supportPhone,
    address: supportAddress,
    emailHref,
    phoneHref,
    fillCopy,
  } = useStoreSettings();
  const channels = buildChannels({
    phone: supportPhone,
    email: supportEmail,
    phoneHref,
    emailHref,
  });
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    supportAddress
  )}`;

  const [formData, setFormData] = useState(EMPTY_LEAD);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const sentRef = useRef(null);

  // Pre-fill the email for a signed-in visitor once auth resolves, without
  // overwriting anything already typed.
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => (prev.email ? prev : { ...prev, email: user.email }));
    }
  }, [user]);

  // The success panel replaces the form in place; move focus to it so a
  // keyboard visitor is not dropped onto <body> when the button disappears.
  useEffect(() => {
    if (isSubmitted) sentRef.current?.focus();
  }, [isSubmitted]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // The same rules as before, said more kindly. Phone stays optional and is
  // only checked once something has been typed into it.
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Please tell us your name";
    if (!formData.email.trim())
      newErrors.email = "Please add an email we can reply to";
    else if (!isEmailValid(formData.email))
      newErrors.email = "That email address doesn't look right";
    if (formData.phone.trim() && !isValidPhone(formData.phone))
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    if (!formData.subject.trim())
      newErrors.subject = "A few words about the subject, please";
    if (!formData.message.trim()) newErrors.message = "Please write your message";
    else if (formData.message.trim().length < MESSAGE_MIN)
      newErrors.message = `A little more, please — at least ${MESSAGE_MIN} characters`;
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setIsSubmitting(true);
    try {
      await apiService.leads.createContact(formData);
      setIsSubmitted(true);
      setFormData({ ...EMPTY_LEAD, email: user?.email || "" });
    } catch {
      setErrors({
        submit:
          "The message didn't send. Please try again, or write to us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // The counter is a hint, never a scold — it says how far along the note is
  // and goes quiet once it clears the floor.
  const messageLength = formData.message.trim().length;
  const messageHint =
    messageLength === 0
      ? `A sentence or two is plenty — at least ${MESSAGE_MIN} characters.`
      : messageLength < MESSAGE_MIN
      ? `${messageLength} of ${MESSAGE_MIN} characters`
      : "";

  const describedBy = (field, extra) =>
    [errors[field] ? `${field}-error` : null, extra].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={`${styles.page} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        {/* ── 1. THE INVITATION ─────────────────────────────────────────── */}
        <header className={styles.head}>
          <p className={styles.eyebrow}>Client care</p>
          <h1 className={styles.title}>We're here to help</h1>
          <p className={styles.lede}>
            Whether you are choosing a first Mekhela Chador, asking after a piece
            already on its way, or learning how to keep Muga for the next
            generation — write to us. Someone at the desk in Kolkata will answer.
          </p>

          <ul className={styles.marks}>
            {MARKS.map((mark) => (
              <li key={mark.label} className={styles.mark}>
                <span className={styles.markValue}>{mark.value}</span>
                <span className={styles.markLabel}>{mark.label}</span>
              </li>
            ))}
          </ul>
          <Link to="/about" className={styles.headLink}>
            Our story
            <Glyph name="arrow" size={14} />
          </Link>
        </header>

        {/* ── 2. THE CHANNELS ───────────────────────────────────────────── */}
        <section className={styles.channels} aria-label="Ways to reach us">
          {channels.map((channel) => (
            <a
              key={channel.key}
              className={styles.channel}
              href={channel.href}
              {...(channel.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className={styles.channelIcon}>
                <Glyph name={channel.glyph} />
              </span>
              <span className={styles.channelLabel}>{channel.label}</span>
              <span className={styles.channelValue}>{channel.value}</span>
              <span className={styles.channelNote}>{channel.note}</span>
            </a>
          ))}
        </section>

        <div className={styles.body}>
          {/* ── 3. THE LETTER ───────────────────────────────────────────── */}
          <section className={styles.letter} aria-labelledby="support-form-title">
            <div className={styles.letterHead}>
              <h2 className={styles.sectionTitle} id="support-form-title">
                Write to us
              </h2>
              <p className={styles.sectionLede}>
                We read every message. Replies come from the desk during
                showroom hours — {SUPPORT_HOURS}.
              </p>
            </div>

            {isSubmitted ? (
              <div className={styles.sent} role="status">
                <span className={styles.sentMark} aria-hidden="true">
                  <Glyph name="check" size={22} strokeWidth={1.2} />
                </span>
                <h3 className={styles.sentTitle} ref={sentRef} tabIndex={-1}>
                  Message sent
                </h3>
                <p className={styles.sentBody}>
                  Your note is with the care desk. We answer during showroom
                  hours — {SUPPORT_HOURS}.
                </p>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => setIsSubmitted(false)}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label htmlFor="name">Your name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      aria-invalid={!!errors.name}
                      aria-describedby={describedBy("name")}
                    />
                    {errors.name && (
                      <span id="name-error" className={styles.fieldError}>
                        {errors.name}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      aria-invalid={!!errors.email}
                      aria-describedby={describedBy("email")}
                    />
                    {errors.email && (
                      <span id="email-error" className={styles.fieldError}>
                        {errors.email}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="phone">
                      Phone <span className={styles.optional}>Optional</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      aria-invalid={!!errors.phone}
                      aria-describedby={describedBy("phone")}
                    />
                    {errors.phone && (
                      <span id="phone-error" className={styles.fieldError}>
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="subject">Subject</label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      autoComplete="off"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      aria-invalid={!!errors.subject}
                      aria-describedby={describedBy("subject")}
                    />
                    {errors.subject && (
                      <span id="subject-error" className={styles.fieldError}>
                        {errors.subject}
                      </span>
                    )}
                  </div>

                  <div className={`${styles.field} ${styles.fieldWide}`}>
                    <label htmlFor="message">Your message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      aria-invalid={!!errors.message}
                      aria-describedby={describedBy(
                        "message",
                        messageHint ? "message-hint" : null
                      )}
                    />
                    {errors.message && (
                      <span id="message-error" className={styles.fieldError}>
                        {errors.message}
                      </span>
                    )}
                    {messageHint && (
                      <span id="message-hint" className={styles.hint}>
                        {messageHint}
                      </span>
                    )}
                  </div>
                </div>

                {errors.submit && (
                  <p className={styles.formError} role="alert">
                    {errors.submit}
                  </p>
                )}

                <div className={styles.formFoot}>
                  <button
                    type="submit"
                    className={styles.sendBtn}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending…" : "Send message"}
                  </button>
                  <p className={styles.formNote}>
                    Your details are used to answer this message and nothing
                    else. <Link to="/privacy">Privacy policy</Link>.
                  </p>
                </div>
              </form>
            )}
          </section>

          {/* ── 4. THE RAIL ─────────────────────────────────────────────── */}
          <aside className={styles.rail}>
            <section className={styles.railCard} aria-labelledby="support-showroom">
              <h2 className={styles.railTitle} id="support-showroom">
                Visit the showroom
              </h2>
              <p className={styles.railLine}>
                <span className={styles.railIcon}>
                  <Glyph name="pin" size={16} />
                </span>
                <span>{supportAddress}</span>
              </p>
              <p className={styles.railLine}>
                <span className={styles.railIcon}>
                  <Glyph name="clock" size={16} />
                </span>
                <span>{SUPPORT_HOURS}</span>
              </p>
              <a
                className={styles.railLink}
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions
                <Glyph name="arrow" size={14} />
              </a>
            </section>

            {SOCIALS.length > 0 && (
              <section className={styles.railCard} aria-labelledby="support-social">
                <h2 className={styles.railTitle} id="support-social">
                  Follow our journey
                </h2>
                <ul className={styles.socials}>
                  {SOCIALS.map((social) => (
                    <li key={social.key}>
                      <a
                        className={styles.social}
                        href={SOCIAL_LINKS[social.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                      >
                        <Glyph name={social.glyph} size={18} />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className={styles.railCard} aria-labelledby="support-why">
              <h2 className={styles.railTitle} id="support-why">
                Why choose us
              </h2>
              <ul className={styles.why}>
                {WHY_CHOOSE_US.map((item) => (
                  <li key={item.id} className={styles.whyRow}>
                    <span className={styles.whyTitle}>{fillCopy(item.title)}</span>
                    <span className={styles.whyDesc}>{item.description}</span>
                  </li>
                ))}
              </ul>
            </section>

            <p className={styles.railFoot}>
              Looking for an answer straight away?{" "}
              <Link to="/help">Read the Help Centre</Link>.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Support;
