import { Head, ViteReactSSG } from "vite-react-ssg";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, Link, useParams, useLoaderData, Navigate, Outlet } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { MapPin, Clock, Phone, Building2, Heart, ShoppingCart, Settings, User, LogOut, X, Menu, ChevronDown, Mail, ArrowRight, Package, Wrench, Truck, ShieldCheck, Filter, Search, ArrowLeft, ChevronLeft, ChevronRight, Calendar, Minus, Plus, Trash2, Edit, Save, LogIn, Lock, CheckCircle, UserPlus, Image, Upload, Tag, FileText, Users } from "lucide-react";
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/lib/supabase.ts");
const supabaseUrl = "https://nonexistent.invalid";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icGF4dmNreHZlcWlkdmdpY25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDUzMjAsImV4cCI6MjA4NTcyMTMyMH0.rv7Wh5cEsXShBdY_vfUJCRMkkoBcQKdXvseM2bpeDzw";
const retryingFetch = async (input, init) => {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const attempts = method === "GET" || method === "HEAD" ? 4 : 1;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(input, init);
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      if (aborted || attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** (attempt - 1)));
    }
  }
};
const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  { global: { fetch: retryingFetch } }
);
const checkIsAdmin = async (userId) => {
  const { data: profile, error } = await supabase.from("profiles").select("is_admin").eq("id", userId).single();
  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
  return profile?.is_admin || false;
};
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/contexts/AuthContext.tsx");
const AuthContext = createContext(void 0);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (() => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });
    return () => subscription.unsubscribe();
  }, []);
  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      setProfile(data);
      const isAdminUser = await checkIsAdmin(userId);
      setIsAdmin(isAdminUser);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };
  const signUp = async (email, password, fullName) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : ""
        }
      });
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error };
    }
  };
  const signIn = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      return { error: err };
    }
  };
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  const updateProfile = async (updates) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ ...updates, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", user.id);
    if (error) throw error;
    await loadProfile(user.id);
  };
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value: { user, profile, isAdmin, loading, signUp, signIn, signOut, updateProfile }, children });
}
function useAuth() {
  const context = useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/components/Header.tsx");
const navLinks = [
  { label: "Главная", path: "/" },
  { label: "Каталог", path: "/catalog", icon: /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }) },
  { label: "Аренда техники", path: "/arenda-tehniki" },
  { label: "Услуги", path: "" },
  { label: "О нас", path: "" },
  { label: "Контакты", path: "/kontakt" }
];
function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    const loadCartCount = async () => {
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id);
      if (data) {
        setCartCount(data.reduce((sum, item) => sum + item.quantity, 0));
      }
    };
    loadCartCount();
    const channel = supabase.channel("header-cart-count").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` },
      loadCartCount
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  const isActive = (path) => {
    if (!path) return false;
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-50", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-gray-900 text-gray-300 text-sm py-2 hidden sm:block", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-6", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center space-x-1", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-3.5 h-3.5 text-brand" }),
            /* @__PURE__ */ jsx("span", { children: "с. Самурза Taraclia 7419" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center space-x-1", children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5 text-brand" }),
            /* @__PURE__ */ jsx("span", { children: "Пн-Пт: 8:00 - 18:00" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center space-x-1", children: [
            /* @__PURE__ */ jsx(Phone, { className: "w-3.5 h-3.5 text-brand" }),
            /* @__PURE__ */ jsx("span", { children: "+373 78719072" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "|" }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-300 cursor-pointer hover:text-white transition", children: "MD" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white border-b border-gray-200 shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between h-16", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center space-x-2 hover:opacity-80 transition", children: [
          /* @__PURE__ */ jsx(Building2, { className: "w-8 h-8 text-brand" }),
          /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-gray-900", children: "DenAlex" })
        ] }),
        /* @__PURE__ */ jsx("nav", { className: "hidden md:flex items-center space-x-1", children: navLinks.map(({ label, path, icon }) => {
          const classes = `px-4 py-2 font-medium transition relative flex items-center space-x-1 ${isActive(path) ? "text-brand-dark" : "text-gray-700 hover:text-brand-dark"}`;
          const content = /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { children: label }),
            icon,
            isActive(path) && /* @__PURE__ */ jsx("span", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-brand" })
          ] });
          return path ? /* @__PURE__ */ jsx(
            Link,
            {
              to: path,
              className: classes,
              "aria-current": isActive(path) ? "page" : void 0,
              children: content
            },
            label
          ) : /* @__PURE__ */ jsx("span", { className: `${classes} cursor-default`, children: content }, label);
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1", children: [
          /* @__PURE__ */ jsx("button", { className: "hidden md:block p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95", children: /* @__PURE__ */ jsx(Heart, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => navigate(user ? "/korzina" : "/vkhod"),
              className: "relative p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95",
              children: [
                /* @__PURE__ */ jsx(ShoppingCart, { className: "w-5 h-5" }),
                cartCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 bg-brand text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center", children: cartCount })
              ]
            }
          ),
          user ? /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center space-x-1", children: [
            isAdmin && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => navigate("/admin"),
                className: "p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95",
                title: "Админ панель",
                children: /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => navigate("/kabinet"),
                className: "p-2 text-gray-600 hover:text-brand-dark transition hover:scale-110 active:scale-95",
                title: profile?.full_name || "Кабинет",
                children: /* @__PURE__ */ jsx(User, { className: "w-5 h-5" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSignOut,
                className: "p-2 text-gray-600 hover:text-red-500 transition hover:scale-110 active:scale-95",
                title: "Выйти",
                children: /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5" })
              }
            )
          ] }) : /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => navigate("/vkhod"),
              className: "hidden md:block px-5 py-2 bg-brand text-gray-900 rounded font-semibold hover:bg-brand-dark transition hover:scale-105 active:scale-95",
              children: "Войти"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setMenuOpen((o) => !o),
              className: "md:hidden p-2 text-gray-600 hover:text-brand-dark transition active:scale-95",
              "aria-label": "Меню",
              children: menuOpen ? /* @__PURE__ */ jsx(X, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(Menu, { className: "w-6 h-6" })
            }
          )
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `md:hidden bg-white border-b border-gray-200 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`,
          children: [
            /* @__PURE__ */ jsx("nav", { className: "px-4 pt-2 pb-4 space-y-1", children: navLinks.map(({ label, path }) => {
              const classes = `block w-full text-left px-4 py-3 rounded-lg font-medium transition ${isActive(path) ? "bg-brand/10 text-brand-dark" : "text-gray-700 hover:bg-gray-100"}`;
              return path ? /* @__PURE__ */ jsx(
                Link,
                {
                  to: path,
                  className: classes,
                  "aria-current": isActive(path) ? "page" : void 0,
                  children: label
                },
                label
              ) : /* @__PURE__ */ jsx("span", { className: `${classes} cursor-default`, children: label }, label);
            }) }),
            /* @__PURE__ */ jsx("div", { className: "border-t border-gray-100 px-4 py-4", children: user ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              profile?.full_name && /* @__PURE__ */ jsx("p", { className: "px-4 py-2 text-sm text-gray-500 font-medium", children: profile.full_name }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => navigate("/kabinet"),
                  className: "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition",
                  children: [
                    /* @__PURE__ */ jsx(User, { className: "w-5 h-5" }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Личный кабинет" })
                  ]
                }
              ),
              isAdmin && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => navigate("/admin"),
                  className: "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition",
                  children: [
                    /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5" }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Админ панель" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleSignOut,
                  className: "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition",
                  children: [
                    /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5" }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Выйти" })
                  ]
                }
              )
            ] }) : /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => navigate("/vkhod"),
                className: "w-full py-3 bg-brand text-gray-900 rounded-lg font-semibold hover:bg-brand-dark transition active:scale-95",
                children: "Войти"
              }
            ) })
          ]
        }
      )
    ] }),
    menuOpen && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-40 bg-black/20 md:hidden",
        onClick: () => setMenuOpen(false)
      }
    )
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/components/Footer.tsx");
function Footer() {
  return /* @__PURE__ */ jsx("footer", { className: "bg-gray-900 text-gray-300 mt-auto", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 mb-4", children: [
          /* @__PURE__ */ jsx(Building2, { className: "w-8 h-8 text-brand" }),
          /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-white", children: "DenAlex" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Надежный партнер в сфере качественных строительных материалов и аренды профессионального оборудования." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-white font-semibold mb-4", children: "Быстрые ссылки" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "О нас" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/catalog", className: "hover:text-white transition", children: "Товары" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/arenda-tehniki", className: "hover:text-white transition", children: "Аренда оборудования" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/kontakt", className: "hover:text-white transition", children: "Контакты" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-white font-semibold mb-4", children: "Служба поддержки" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "Центр помощи" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "Информация о доставке" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "Возврат" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "Условия и положения" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-white font-semibold mb-4", children: "Контактная информация" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-3 text-sm", children: [
          /* @__PURE__ */ jsxs("li", { className: "flex items-start space-x-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 flex-shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: "с. Самурза Taraclia 7419" })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx(Phone, { className: "w-5 h-5" }),
            /* @__PURE__ */ jsx("span", { children: "+37378719072" })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx(Phone, { className: "w-5 h-5" }),
            /* @__PURE__ */ jsx("span", { children: "+37378790842" })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx(Mail, { className: "w-5 h-5" }),
            /* @__PURE__ */ jsx("span", { children: "covacialexandr@gmail.com" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border-t border-gray-800 mt-8 pt-8 text-sm text-center", children: /* @__PURE__ */ jsx("p", { children: "© 2024 DenAlex. Все права защищены." }) })
  ] }) });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/components/Seo.tsx");
const SITE_URL = "https://den-alex.com";
const SITE_NAME = "DenAlex";
const DEFAULT_IMAGE = `${SITE_URL}/covaci-site.png`;
function Seo({
  title,
  description,
  path,
  image,
  type = "website",
  jsonLd
}) {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const img = image || DEFAULT_IMAGE;
  return /* @__PURE__ */ jsxs(Head, { children: [
    /* @__PURE__ */ jsx("title", { children: fullTitle }),
    /* @__PURE__ */ jsx("meta", { name: "description", content: description }),
    /* @__PURE__ */ jsx("link", { rel: "canonical", href: url }),
    /* @__PURE__ */ jsx("meta", { property: "og:type", content: type }),
    /* @__PURE__ */ jsx("meta", { property: "og:site_name", content: SITE_NAME }),
    /* @__PURE__ */ jsx("meta", { property: "og:locale", content: "ru_RU" }),
    /* @__PURE__ */ jsx("meta", { property: "og:title", content: fullTitle }),
    /* @__PURE__ */ jsx("meta", { property: "og:description", content: description }),
    /* @__PURE__ */ jsx("meta", { property: "og:url", content: url }),
    /* @__PURE__ */ jsx("meta", { property: "og:image", content: img }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
    jsonLd && /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(jsonLd).replace(/</g, "\\u003c") })
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/utils/slugify.ts");
const CYRILLIC = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "j",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya"
};
function slugify(str) {
  return str.toLowerCase().split("").map((c) => CYRILLIC[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/hooks/useAppNav.ts");
const PAGE_TO_PATH = {
  home: "/",
  products: "/catalog",
  equipment: "/arenda-tehniki",
  cart: "/korzina",
  cabinet: "/kabinet",
  admin: "/admin",
  login: "/vkhod",
  register: "/registraciya",
  contact: "/kontakt"
};
function useAppNav() {
  const navigate = useNavigate();
  return useCallback((page) => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (page.startsWith("product-detail:")) {
      navigate("/tovar/" + page.split(":")[1]);
    } else if (page.startsWith("products:")) {
      navigate("/catalog/" + page.split(":")[1]);
    } else {
      navigate(PAGE_TO_PATH[page] ?? "/");
    }
  }, [navigate]);
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/pages/Home.tsx");
const CATEGORY_IMAGES = {
  default: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop",
  цемент: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop",
  кирпич: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop",
  изоляция: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop",
  инструменты: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=400&auto=format&fit=crop",
  краска: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=400&auto=format&fit=crop",
  трубы: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop"
};
const EQUIPMENT_IMAGES = {
  default: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=600&auto=format&fit=crop",
  экскаватор: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
  погрузчик: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop",
  кран: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop",
  бульдозер: "https://images.unsplash.com/photo-1561955553-6dc6aa0cd5fb?q=80&w=600&auto=format&fit=crop",
  каток: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=600&auto=format&fit=crop"
};
function Home() {
  const onNavigate = useAppNav();
  const [categories, setCategories] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadCategories = supabase.from("categories").select("*").eq("type", "product").order("name").limit(6).then(({ data }) => {
      if (data) setCategories(data);
    });
    const loadEquipment = supabase.from("equipment").select("*").eq("is_available", true).eq("is_archived", false).order("name").limit(3).then(({ data }) => {
      if (data) setEquipment(data);
    });
    Promise.all([loadCategories, loadEquipment]).finally(() => setLoading(false));
  }, []);
  const getEquipmentImage = (item) => {
    if (item.images?.[0]) return item.images[0];
    const nameLower = item.name.toLowerCase();
    const matchedKey = Object.keys(EQUIPMENT_IMAGES).find(
      (key) => nameLower.includes(key)
    );
    return matchedKey ? EQUIPMENT_IMAGES[matchedKey] : EQUIPMENT_IMAGES.default;
  };
  const getCategoryImage = (category) => {
    if (category.image_url) return category.image_url;
    const nameLower = category.name.toLowerCase();
    const matchedKey = Object.keys(CATEGORY_IMAGES).find(
      (key) => nameLower.includes(key)
    );
    return matchedKey ? CATEGORY_IMAGES[matchedKey] : CATEGORY_IMAGES.default;
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      Seo,
      {
        title: "DenAlex — строительные материалы и аренда оборудования",
        description: "DenAlex: качественные строительные материалы и аренда профессионального оборудования.",
        path: "/"
      }
    ),
    /* @__PURE__ */ jsxs("section", { className: "bg-white overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-center min-h-[520px] py-12 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 z-10", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6", children: [
            "Все для",
            /* @__PURE__ */ jsx("br", {}),
            "строительства",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { className: "text-gray-900", children: "в одном месте" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-gray-500 text-lg mb-8 max-w-md leading-relaxed", children: [
            "Строительные материалы, спецтехника в аренду",
            /* @__PURE__ */ jsx("br", {}),
            "и професиональные услуги"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => onNavigate("products"),
                className: "inline-flex items-center space-x-2 px-7 py-3.5 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-yellow-500 transition",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Каталог товаров" }),
                  /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => onNavigate("equipment"),
                className: "inline-flex items-center space-x-2 px-7 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded hover:border-gray-400 transition",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "Аренда техники" }),
                  /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 relative flex items-center justify-center", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "/shop.png",
            alt: "Строительная техника",
            className: "w-full max-w-xl object-contain drop-shadow-2xl rounded-lg"
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-gray-100 bg-gray-50", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Package, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800", children: "Широкий ассортимент" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "материалов" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Wrench, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800", children: "Современная техника" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "в оренду" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Truck, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800", children: "Доставка по всей" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "Молдове" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800", children: "Гарантия качества" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "и надёжности" })
          ] })
        ] })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "py-14 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Популярные категории" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => onNavigate("products"),
            className: "inline-flex items-center space-x-1 text-gray-600 hover:text-yellow-500 font-medium transition text-sm",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Все категории" }),
              /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
            ]
          }
        )
      ] }),
      !loading ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4", children: categories.map((category) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onNavigate("products:" + slugify(category.name)),
          className: "group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-yellow-400 hover:shadow-md transition-all duration-200 text-left",
          children: [
            /* @__PURE__ */ jsx("div", { className: "h-36 overflow-hidden bg-gray-50", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: getCategoryImage(category),
                alt: category.name,
                className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "p-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800 leading-tight mb-1", children: category.name }),
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end", children: /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5 text-gray-300 group-hover:text-yellow-500 transition-colors" }) })
            ] })
          ]
        },
        category.id
      )) }) : (
        /* Заглушка пока загружаются данные */
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4", children: [...Array(6)].map((_, i) => /* @__PURE__ */ jsx("div", { className: "bg-gray-100 rounded-lg h-52 animate-pulse" }, i)) })
      )
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "py-14 bg-white", children: [
      /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:w-64 flex-shrink-0 flex flex-col justify-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-4 h-4 bg-yellow-400 rounded-sm flex-shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-yellow-500 uppercase tracking-widest", children: "Аренда техники" })
          ] }),
          /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold text-gray-900 leading-tight mb-4", children: [
            "Надёжная техника",
            /* @__PURE__ */ jsx("br", {}),
            "для любых задач"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm leading-relaxed mb-8", children: "Аренда строительной и спецтехники на выгодных условиях. Опытные операторы и полное техническое обслуживание." }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => onNavigate("equipment"),
              className: "inline-flex items-center space-x-2 px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-yellow-500 transition w-fit",
              children: [
                /* @__PURE__ */ jsx("span", { children: "Посмотреть технику" }),
                /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 relative", children: !loading ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: equipment.map((item) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow",
            children: [
              /* @__PURE__ */ jsx("div", { className: "h-44 bg-gray-50 overflow-hidden", children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: getEquipmentImage(item),
                  alt: item.name,
                  className: "w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-800 text-sm mb-2 leading-tight", children: item.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-yellow-500 font-bold text-sm mb-3", children: [
                  "от ",
                  item.daily_rate.toLocaleString("ru-RU"),
                  " грн",
                  /* @__PURE__ */ jsx("span", { className: "text-gray-400 font-normal text-xs", children: " / смена" })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => onNavigate("equipment"),
                    className: "w-full py-2 border border-gray-300 text-gray-700 text-sm rounded hover:border-yellow-400 hover:text-yellow-500 transition",
                    children: "Подробнее"
                  }
                )
              ] })
            ]
          },
          item.id
        )) }) : (
          /* Скелетон пока загружается */
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [...Array(3)].map((_, i) => /* @__PURE__ */ jsxs("div", { className: "border border-gray-200 rounded-lg overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "h-44 bg-gray-100 animate-pulse" }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-2", children: [
              /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-100 rounded animate-pulse w-3/4" }),
              /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-100 rounded animate-pulse w-1/2" }),
              /* @__PURE__ */ jsx("div", { className: "h-8 bg-gray-100 rounded animate-pulse mt-3" })
            ] })
          ] }, i)) })
        ) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-gray-100 pt-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800", children: "Большой опыт" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "более 10 лет на рынке" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Wrench, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800", children: "Индивидуальный подход" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "подберём решение для вас" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Package, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800", children: "Гибкие условия" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "для постоянных клиентов" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 flex-shrink-0 bg-yellow-50 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Truck, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-800", children: "Быстрая доставка" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "в день заказа" })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/pages/Products.tsx");
function Products() {
  const { slug } = useParams();
  return /* @__PURE__ */ jsx(ProductsView, {}, slug ?? "all");
}
function ProductsView() {
  const onNavigate = useAppNav();
  const { slug } = useParams();
  const { user } = useAuth();
  const initial = useLoaderData();
  const [products, setProducts] = useState(initial?.products ?? []);
  const [categories, setCategories] = useState(initial?.categories ?? []);
  const [loading, setLoading] = useState(!initial);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initial?.category?.id ?? "");
  const [addingToCart, setAddingToCart] = useState(null);
  const firstLoad = useRef(Boolean(initial));
  useEffect(() => {
    loadCategories();
  }, []);
  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").eq("type", "product").order("name");
    if (data) {
      setCategories(data);
      if (slug) {
        const match = data.find((c) => c.slug === slug);
        if (match) setSelectedCategory(match.id);
      }
    }
  };
  const loadProducts = async () => {
    if (!firstLoad.current) setLoading(true);
    let query = supabase.from("products").select("*").eq("is_active", true).order("name");
    if (selectedCategory) {
      query = query.eq("category_id", selectedCategory);
    }
    const { data } = await query;
    if (data) {
      const filtered = searchTerm ? data.filter(
        (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ) : data;
      setProducts(filtered);
    }
    firstLoad.current = false;
    setLoading(false);
  };
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchTerm]);
  const addToCart = async (product) => {
    if (!user) {
      onNavigate("login");
      return;
    }
    setAddingToCart(product.id);
    const { data: existing } = await supabase.from("cart_items").select("*").eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1
      });
    }
    setAddingToCart(null);
  };
  const activeCategory = categories.find((c) => c.id === selectedCategory);
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsx(
      Seo,
      {
        title: activeCategory ? activeCategory.name : "Строительные материалы",
        description: activeCategory ? `${activeCategory.name} в DenAlex: цены и наличие.` : "Каталог строительных материалов DenAlex: цены и наличие.",
        path: activeCategory ? `/catalog/${activeCategory.slug}` : "/catalog"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-2", children: "Строительные материалы" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Просмотрите наш обширный каталог качественных строительных материалов" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-4 gap-8", children: [
      /* @__PURE__ */ jsx("aside", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-md p-6 sticky top-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 mb-4", children: [
          /* @__PURE__ */ jsx(Filter, { className: "w-5 h-5 text-gray-600" }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Фильтры" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Поиск" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent",
                placeholder: "Поиск товаров..."
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Категория" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/catalog",
                className: `block w-full text-left px-3 py-2 rounded-lg transition ${selectedCategory === "" ? "bg-yellow-50 text-yellow-600 font-medium" : "hover:bg-gray-100"}`,
                children: "Все категории"
              }
            ),
            categories.map((category) => /* @__PURE__ */ jsx(
              Link,
              {
                to: `/catalog/${category.slug}`,
                className: `block w-full text-left px-3 py-2 rounded-lg transition ${selectedCategory === category.id ? "bg-yellow-50 text-yellow-600 font-medium" : "hover:bg-gray-100"}`,
                children: category.name
              },
              category.id
            ))
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-3", children: loading ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-4", children: "Загрузка товаров..." })
      ] }) : products.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 bg-white rounded-lg shadow-md", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Товары не найдены" }) }) : /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-6", children: products.map((product) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
          children: [
            /* @__PURE__ */ jsx("div", { className: "h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center", children: product.images?.[0] ? /* @__PURE__ */ jsx(
              "img",
              {
                src: product.images[0],
                alt: product.name,
                className: "w-full h-full object-cover"
              }
            ) : /* @__PURE__ */ jsx("span", { className: "text-gray-400 text-4xl font-bold", children: product.name.charAt(0) }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: /* @__PURE__ */ jsx(Link, { to: `/tovar/${product.slug}`, className: "after:absolute after:inset-0", children: product.name }) }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-3 line-clamp-2", children: product.description }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between mb-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-2xl font-bold text-yellow-600", children: [
                    product.price.toFixed(2),
                    " MDL"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-500 ml-1", children: [
                    "/ ",
                    product.unit
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-1 rounded-full ${product.stock_quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`, children: product.stock_quantity > 0 ? `${product.stock_quantity} в наличии` : "Нет в наличии" })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => addToCart(product),
                  disabled: product.stock_quantity === 0 || addingToCart === product.id,
                  className: "relative z-10 w-full bg-brand text-gray-900 py-2 rounded-lg font-medium hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-95",
                  children: [
                    /* @__PURE__ */ jsx(ShoppingCart, { className: "w-5 h-5" }),
                    /* @__PURE__ */ jsx("span", { children: addingToCart === product.id ? "Добавление..." : "Добавить в корзину" })
                  ]
                }
              )
            ] })
          ]
        },
        product.id
      )) }) })
    ] })
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/pages/ProductDetail.tsx");
function ProductDetail() {
  const { slug: productSlug } = useParams();
  const onNavigate = useAppNav();
  const { user } = useAuth();
  const initial = useLoaderData();
  const [product, setProduct] = useState(initial?.product ?? null);
  const [category, setCategory] = useState(initial?.category ?? null);
  const [loading, setLoading] = useState(!initial?.product);
  const [activeIndex, setActiveIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (productSlug) loadProduct();
  }, [productSlug]);
  const loadProduct = async () => {
    if (!productSlug) return;
    if (!product || product.slug !== productSlug) setLoading(true);
    const { data } = await supabase.from("products").select("*").eq("slug", productSlug).single();
    if (data) {
      setProduct(data);
      if (data.category_id) {
        const { data: cat } = await supabase.from("categories").select("*").eq("id", data.category_id).single();
        if (cat) setCategory(cat);
      }
    }
    setLoading(false);
  };
  const getImages = () => {
    if (!product) return [];
    const imgs = [];
    if (product.images?.length) imgs.push(...product.images);
    else if (product.image_url) imgs.push(product.image_url);
    return imgs;
  };
  const images = getImages();
  const prev = () => setActiveIndex((i) => i === 0 ? images.length - 1 : i - 1);
  const next = () => setActiveIndex((i) => i === images.length - 1 ? 0 : i + 1);
  const addToCart = async () => {
    if (!user) {
      onNavigate("login");
      return;
    }
    if (!product) return;
    setAddingToCart(true);
    const { data: existing } = await supabase.from("cart_items").select("*").eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1
      });
    }
    setAddingToCart(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2e3);
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 py-16 flex justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Загрузка..." })
    ] }) });
  }
  if (!product) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-lg mb-4", children: "Товар не найден" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onNavigate("products"),
          className: "inline-flex items-center space-x-2 text-yellow-600 hover:underline",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { children: "Вернуться в каталог" })
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsx(
      Seo,
      {
        title: product.name,
        description: (product.description?.trim() || `${product.name} в DenAlex: цена и наличие.`).slice(0, 160),
        path: `/tovar/${product.slug}`,
        image: images[0],
        type: "product",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description ?? void 0,
          image: images.length > 0 ? images : void 0,
          category: category?.name,
          offers: {
            "@type": "Offer",
            url: `https://den-alex.com/tovar/${product.slug}`,
            priceCurrency: "MDL",
            price: product.price,
            availability: product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }
      }
    ),
    /* @__PURE__ */ jsxs("nav", { "aria-label": "Breadcrumb", className: "flex items-center space-x-2 text-sm text-gray-500 mb-6", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-gray-700 transition", children: "Главная" }),
      /* @__PURE__ */ jsx("span", { children: "/" }),
      /* @__PURE__ */ jsx(Link, { to: "/catalog", className: "hover:text-gray-700 transition", children: "Каталог" }),
      category && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { children: "/" }),
        /* @__PURE__ */ jsx(Link, { to: `/catalog/${category.slug}`, className: "hover:text-gray-700 transition", children: category.name })
      ] }),
      /* @__PURE__ */ jsx("span", { children: "/" }),
      /* @__PURE__ */ jsx("span", { className: "text-gray-900 font-medium truncate max-w-[200px]", children: product.name })
    ] }),
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/catalog",
        className: "inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition mb-8 group",
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Назад в каталог" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "relative bg-gray-100 rounded-2xl overflow-hidden aspect-square mb-4 group", children: [
          images.length > 0 ? /* @__PURE__ */ jsx(
            "img",
            {
              src: images[activeIndex],
              alt: product.name,
              className: "w-full h-full object-cover transition-opacity duration-300"
            },
            activeIndex
          ) : /* @__PURE__ */ jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center text-gray-400", children: [
            /* @__PURE__ */ jsx(Package, { className: "w-24 h-24 mb-2" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Нет фото" })
          ] }),
          images.length > 1 && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: prev,
                className: "absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition opacity-0 group-hover:opacity-100",
                children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-5 h-5 text-gray-700" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: next,
                className: "absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition opacity-0 group-hover:opacity-100",
                children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-5 h-5 text-gray-700" })
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5", children: images.map((_, i) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setActiveIndex(i),
                className: `w-2 h-2 rounded-full transition-all duration-200 ${i === activeIndex ? "bg-white w-5" : "bg-white/60"}`
              },
              i
            )) })
          ] })
        ] }),
        images.length > 1 && /* @__PURE__ */ jsx("div", { className: "flex space-x-3 overflow-x-auto pb-1", children: images.map((src, i) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveIndex(i),
            className: `flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${i === activeIndex ? "border-brand scale-105 shadow-md" : "border-transparent hover:border-gray-300 opacity-70 hover:opacity-100"}`,
            children: /* @__PURE__ */ jsx("img", { src, alt: `фото ${i + 1}`, className: "w-full h-full object-cover" })
          },
          i
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-3", children: product.name }),
        /* @__PURE__ */ jsx("span", { className: `self-start text-sm px-3 py-1 rounded-full font-medium mb-6 ${product.stock_quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`, children: product.stock_quantity > 0 ? `В наличии: ${product.stock_quantity} ${product.unit}` : "Нет в наличии" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline space-x-2 mb-8", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-4xl font-black text-yellow-600", children: [
            product.price.toFixed(2),
            " MDL"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-lg text-gray-500", children: [
            "/ ",
            product.unit
          ] })
        ] }),
        product.description && /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2", children: "Описание" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-700 leading-relaxed", children: product.description })
        ] }),
        category && /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2", children: "Категория" }),
          /* @__PURE__ */ jsx("span", { className: "inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm", children: category.name })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: addToCart,
            disabled: product.stock_quantity === 0 || addingToCart,
            className: `mt-auto w-full flex items-center justify-center space-x-3 py-4 rounded-xl font-semibold text-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${added ? "bg-green-500 text-white" : "bg-brand hover:bg-brand-dark text-gray-900 hover:shadow-lg hover:scale-[1.02]"}`,
            children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "w-6 h-6" }),
              /* @__PURE__ */ jsx("span", { children: addingToCart ? "Добавление..." : added ? "Добавлено!" : "Добавить в корзину" })
            ]
          }
        )
      ] })
    ] })
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/pages/Equipment.tsx");
function EquipmentPage() {
  const { slug } = useParams();
  return /* @__PURE__ */ jsx(EquipmentView, {}, slug ?? "all");
}
function EquipmentView() {
  const onNavigate = useAppNav();
  const { slug } = useParams();
  const { user } = useAuth();
  const initial = useLoaderData();
  const [equipment, setEquipment] = useState(initial?.equipment ?? []);
  const [categories, setCategories] = useState(initial?.categories ?? []);
  const [loading, setLoading] = useState(!initial);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initial?.category?.id ?? "");
  const firstLoad = useRef(Boolean(initial));
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    loadCategories();
    loadEquipment();
  }, []);
  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").eq("type", "equipment").order("name");
    if (data) {
      setCategories(data);
      if (slug) {
        const match = data.find((c) => c.slug === slug);
        if (match) setSelectedCategory(match.id);
      }
    }
  };
  const loadEquipment = async () => {
    if (!firstLoad.current) setLoading(true);
    let query = supabase.from("equipment").select("*").eq("is_available", true).eq("is_archived", false).order("name");
    if (selectedCategory) {
      query = query.eq("category_id", selectedCategory);
    }
    const { data } = await query;
    if (data) {
      const filtered = searchTerm ? data.filter(
        (e) => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ) : data;
      setEquipment(filtered);
    }
    firstLoad.current = false;
    setLoading(false);
  };
  useEffect(() => {
    loadEquipment();
  }, [selectedCategory, searchTerm]);
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };
  const handleRentalRequest = async () => {
    if (!user) {
      onNavigate("login");
      return;
    }
    if (!selectedEquipment || !startDate || !endDate) return;
    const days = calculateDays();
    if (days <= 0) {
      alert("Пожалуйста, выберите действительные даты аренды");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("rentals").insert({
      user_id: user.id,
      equipment_id: selectedEquipment.id,
      start_date: startDate,
      end_date: endDate,
      total_days: days,
      daily_rate: selectedEquipment.daily_rate,
      deposit_paid: selectedEquipment.deposit_amount,
      total_amount: selectedEquipment.daily_rate * days,
      status: "pending"
    });
    setSubmitting(false);
    if (error) {
      alert("Ошибка при отправке запроса на аренду");
    } else {
      alert("Запрос на аренду успешно отправлен!");
      setSelectedEquipment(null);
      setStartDate("");
      setEndDate("");
    }
  };
  const activeCategory = categories.find((c) => c.id === selectedCategory);
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsx(
      Seo,
      {
        title: activeCategory ? activeCategory.name : "Аренда оборудования",
        description: activeCategory ? `${activeCategory.name} в аренду в DenAlex: цены за сутки и наличие.` : "Аренда профессионального оборудования и инструмента в DenAlex: цены за сутки и наличие.",
        path: activeCategory ? `/arenda-tehniki/${activeCategory.slug}` : "/arenda-tehniki"
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-2", children: "Аренда оборудования" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Профессиональные инструменты и оборудование для ваших строительных нужд" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-4 gap-8", children: [
      /* @__PURE__ */ jsx("aside", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-md p-6 sticky top-24", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 mb-4", children: [
          /* @__PURE__ */ jsx(Filter, { className: "w-5 h-5 text-gray-600" }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Фильтры" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Поиск" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent",
                placeholder: "Поиск оборудования..."
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Категория" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/arenda-tehniki",
                className: `block w-full text-left px-3 py-2 rounded-lg transition ${selectedCategory === "" ? "bg-green-50 text-green-600 font-medium" : "hover:bg-gray-100"}`,
                children: "Все категории"
              }
            ),
            categories.map((category) => /* @__PURE__ */ jsx(
              Link,
              {
                to: `/arenda-tehniki/${category.slug}`,
                className: `block w-full text-left px-3 py-2 rounded-lg transition ${selectedCategory === category.id ? "bg-green-50 text-green-600 font-medium" : "hover:bg-gray-100"}`,
                children: category.name
              },
              category.id
            ))
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-3", children: loading ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-4", children: "Загрузка оборудования..." })
      ] }) : equipment.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 bg-white rounded-lg shadow-md", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Оборудование не найдено" }) }) : /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-6", children: equipment.map((item) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
          children: [
            /* @__PURE__ */ jsx("div", { className: "h-48 bg-gradient-to-br from-green-200 to-green-300 flex items-center justify-center", children: item.images?.[0] ? /* @__PURE__ */ jsx(
              "img",
              {
                src: item.images[0],
                alt: item.name,
                className: "w-full h-full object-cover"
              }
            ) : /* @__PURE__ */ jsx("span", { className: "text-green-700 text-4xl font-bold", children: item.name.charAt(0) }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: item.name }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mb-3 line-clamp-2", children: item.description }),
              /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between mb-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Дневная ставка:" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-xl font-bold text-green-600", children: [
                    item.daily_rate.toFixed(2),
                    " MDL"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Депозит:" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-gray-700", children: [
                    item.deposit_amount.toFixed(2),
                    " MDL"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setSelectedEquipment(item),
                  className: "w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-95",
                  children: [
                    /* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5" }),
                    /* @__PURE__ */ jsx("span", { children: "Запросить аренду" })
                  ]
                }
              )
            ] })
          ]
        },
        item.id
      )) }) })
    ] }),
    selectedEquipment && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl max-w-md w-full p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold", children: "Запрос на аренду" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSelectedEquipment(null),
            className: "p-2 hover:bg-gray-100 rounded-lg transition",
            children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("h4", { className: "font-semibold text-lg mb-2", children: selectedEquipment.name }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-600 space-y-1", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            "Дневная ставка: ",
            selectedEquipment.daily_rate.toFixed(2),
            " MDL"
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "Требуемый депозит: ",
            selectedEquipment.deposit_amount.toFixed(2),
            " MDL"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Дата начала" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: startDate,
              onChange: (e) => setStartDate(e.target.value),
              min: today,
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Дата окончания" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: endDate,
              onChange: (e) => setEndDate(e.target.value),
              min: startDate || today,
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            }
          )
        ] }),
        startDate && endDate && calculateDays() > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-green-50 p-4 rounded-lg", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Дней аренды:" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold", children: calculateDays() })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Дневная ставка:" }),
            /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
              selectedEquipment.daily_rate.toFixed(2),
              " MDL"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Депозит:" }),
            /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
              selectedEquipment.deposit_amount.toFixed(2),
              " MDL"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border-t border-green-200 mt-2 pt-2 flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Итого:" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xl font-bold text-green-600", children: [
              (selectedEquipment.daily_rate * calculateDays()).toFixed(2),
              " MDL"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleRentalRequest,
            disabled: !startDate || !endDate || calculateDays() <= 0 || submitting,
            className: "w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed",
            children: submitting ? "Отправка..." : "Отправить запрос"
          }
        )
      ] })
    ] }) })
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/lib/edgeFunctions.ts");
async function processCheckout(request) {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("You must be logged in to checkout");
    }
    const { data, error } = await supabase.functions.invoke("checkout", {
      body: request,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    if (error) {
      throw new Error(error.message || "Checkout failed");
    }
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error("Checkout error:", error);
    throw error;
  }
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/pages/Cart.tsx");
function Cart() {
  const onNavigate = useAppNav();
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (user) {
      loadCart();
      setDeliveryAddress(profile?.address || "");
    }
  }, [user, profile]);
  const loadCart = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("cart_items").select(`
        *,
        products (*)
      `).eq("user_id", user.id);
    if (data) {
      setCartItems(data);
    }
    setLoading(false);
  };
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", itemId);
    loadCart();
  };
  const removeItem = async (itemId) => {
    await supabase.from("cart_items").delete().eq("id", itemId);
    loadCart();
  };
  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.products.price * item.quantity,
      0
    );
  };
  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) return;
    if (!deliveryAddress.trim()) {
      alert("Пожалуйста, введите адрес доставки");
      return;
    }
    setProcessing(true);
    try {
      await processCheckout({
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.products.price
        })),
        delivery_address: deliveryAddress,
        total_amount: calculateTotal()
      });
      await supabase.from("cart_items").delete().eq("user_id", user.id);
      alert("Заказ успешно оформлен!");
      onNavigate("cabinet");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ошибка при оформлении заказа");
    } finally {
      setProcessing(false);
    }
  };
  if (!user) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsx(ShoppingCart, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Пожалуйста, войдите" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-6", children: "Вам нужно войти в систему, чтобы увидеть вашу корзину" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onNavigate("login"),
          className: "px-6 py-3 bg-brand text-gray-900 rounded-lg font-medium hover:bg-brand-dark transition",
          children: "Войти"
        }
      )
    ] });
  }
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-4", children: "Загрузка корзины..." })
    ] });
  }
  if (cartItems.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-16 text-center", children: [
      /* @__PURE__ */ jsx(ShoppingCart, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Ваша корзина пуста" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-6", children: "Добавьте несколько товаров, чтобы начать" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onNavigate("products"),
          className: "px-6 py-3 bg-brand text-gray-900 rounded-lg font-medium hover:bg-brand-dark transition",
          children: "Просмотр товаров"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-8", children: "Корзина покупок" }),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-4", children: cartItems.map((item) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-white rounded-lg shadow-md p-6 flex items-center space-x-4",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0", children: item.products.images?.[0] ? /* @__PURE__ */ jsx(
              "img",
              {
                src: item.products.images[0],
                alt: item.products.name,
                className: "w-full h-full object-cover rounded-lg"
              }
            ) : /* @__PURE__ */ jsx("span", { className: "text-gray-400 text-2xl font-bold", children: item.products.name.charAt(0) }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-grow", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-1", children: item.products.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mb-2", children: [
                item.products.price.toFixed(2),
                " MDL / ",
                item.products.unit
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => updateQuantity(item.id, item.quantity - 1),
                    className: "p-1 bg-gray-100 hover:bg-gray-200 rounded transition",
                    children: /* @__PURE__ */ jsx(Minus, { className: "w-4 h-4" })
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "font-medium w-12 text-center", children: item.quantity }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => updateQuantity(item.id, item.quantity + 1),
                    className: "p-1 bg-gray-100 hover:bg-gray-200 rounded transition",
                    children: /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-gray-900 mb-2", children: [
                (item.products.price * item.quantity).toFixed(2),
                " MDL"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => removeItem(item.id),
                  className: "text-red-600 hover:text-red-700 transition",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5" })
                }
              )
            ] })
          ]
        },
        item.id
      )) }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-md p-6 sticky top-24", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold mb-4", children: "Сводка заказа" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 mb-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Промежуточный итог:" }),
            /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
              calculateTotal().toFixed(2),
              " MDL"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border-t pt-3 flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-lg font-bold", children: "Итого:" }),
            /* @__PURE__ */ jsxs("span", { className: "text-2xl font-bold text-yellow-600", children: [
              calculateTotal().toFixed(2),
              " MDL"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Адрес доставки" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: deliveryAddress,
                onChange: (e) => setDeliveryAddress(e.target.value),
                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent",
                rows: 3,
                placeholder: "Введите адрес доставки...",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Примечания (необязательно)" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: notes,
                onChange: (e) => setNotes(e.target.value),
                className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent",
                rows: 2,
                placeholder: "Любые специальные инструкции..."
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleCheckout,
            disabled: processing,
            className: "w-full bg-brand text-gray-900 py-3 rounded-lg font-semibold hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed",
            children: processing ? "Обработка..." : "Перейти к оформлению заказа"
          }
        )
      ] }) })
    ] })
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/pages/Cabinet.tsx");
function Cabinet() {
  const onNavigate = useAppNav();
  const { user, profile, isAdmin, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    company_name: profile?.company_name || "",
    address: profile?.address || ""
  });
  useEffect(() => {
    if (user) {
      loadOrders();
      loadRentals();
    }
  }, [user]);
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || "",
        company_name: profile.company_name || "",
        address: profile.address || ""
      });
    }
  }, [profile]);
  const loadOrders = async () => {
    if (!user) return;
    const { data } = await supabase.from("orders").select(`
        *,
        order_items (
          *,
          products (*)
        )
      `).eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) {
      setOrders(data);
    }
  };
  const loadRentals = async () => {
    if (!user) return;
    const { data } = await supabase.from("rentals").select(`
        *,
        equipment (*)
      `).eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) {
      setRentals(data);
    }
  };
  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setEditing(false);
      alert("Профиль успешно обновлен!");
    } catch (error) {
      alert("Ошибка при обновлении профиля");
    }
  };
  const ORDER_STATUS_LABELS = {
    pending: "Ожидает",
    confirmed: "Подтверждён",
    shipped: "Отправлен",
    delivered: "Доставлен",
    cancelled: "Отменён"
  };
  const RENTAL_STATUS_LABELS = {
    pending: "Ожидает",
    active: "Активна",
    completed: "Завершена",
    cancelled: "Отменена"
  };
  const STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-purple-100 text-purple-700",
    shipped: "bg-cyan-100 text-cyan-700",
    delivered: "bg-green-100 text-green-700",
    active: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700"
  };
  const getStatusColor = (status) => STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
  if (!user) {
    onNavigate("login");
    return null;
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-8", children: "Личный кабинет" }),
    /* @__PURE__ */ jsx("div", { className: "mb-6 border-b border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-8", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("profile"),
          className: `pb-4 px-2 font-medium transition ${activeTab === "profile" ? "border-b-2 border-brand text-yellow-600" : "text-gray-500 hover:text-gray-700"}`,
          children: [
            /* @__PURE__ */ jsx(User, { className: "w-5 h-5 inline mr-2" }),
            "Профиль"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("orders"),
          className: `pb-4 px-2 font-medium transition ${activeTab === "orders" ? "border-b-2 border-brand text-yellow-600" : "text-gray-500 hover:text-gray-700"}`,
          children: [
            /* @__PURE__ */ jsx(Package, { className: "w-5 h-5 inline mr-2" }),
            "Заказы (",
            orders.length,
            ")"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("rentals"),
          className: `pb-4 px-2 font-medium transition ${activeTab === "rentals" ? "border-b-2 border-brand text-yellow-600" : "text-gray-500 hover:text-gray-700"}`,
          children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 inline mr-2" }),
            "Аренда (",
            rentals.length,
            ")"
          ]
        }
      ),
      isAdmin && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onNavigate("admin"),
          className: "pb-4 px-2 font-medium transition flex items-center space-x-2 text-gray-500 hover:text-gray-700",
          children: [
            /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5" }),
            /* @__PURE__ */ jsx("span", { children: "Админ-панель" })
          ]
        }
      )
    ] }) }),
    activeTab === "profile" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-md p-6 max-w-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Информация профиля" }),
        !editing ? /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setEditing(true),
            className: "flex items-center space-x-2 px-4 py-2 bg-brand text-gray-900 rounded-lg hover:bg-brand-dark transition",
            children: [
              /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: "Редактировать" })
            ]
          }
        ) : /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleSaveProfile,
            className: "flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition",
            children: [
              /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: "Сохранить" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Полное имя" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: formData.full_name,
              onChange: (e) => setFormData({ ...formData, full_name: e.target.value }),
              disabled: !editing,
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-50"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: user.email,
              disabled: true,
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Телефон" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "tel",
              value: formData.phone,
              onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
              disabled: !editing,
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-50"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Название компании (необязательно)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: formData.company_name,
              onChange: (e) => setFormData({ ...formData, company_name: e.target.value }),
              disabled: !editing,
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-50"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Адрес" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: formData.address,
              onChange: (e) => setFormData({ ...formData, address: e.target.value }),
              disabled: !editing,
              className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-50",
              rows: 3
            }
          )
        ] })
      ] })
    ] }),
    activeTab === "orders" && /* @__PURE__ */ jsx("div", { className: "space-y-4", children: orders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-md p-12 text-center", children: [
      /* @__PURE__ */ jsx(Package, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Заказов пока нет" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onNavigate("products"),
          className: "mt-4 px-6 py-2 bg-brand text-gray-900 rounded-lg hover:bg-brand-dark transition",
          children: "Начать покупки"
        }
      )
    ] }) : orders.map((order) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-1", children: [
            "Заказ #",
            order.id.slice(0, 8)
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: new Date(order.created_at ?? "").toLocaleDateString() })
        ] }),
        /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`, children: ORDER_STATUS_LABELS[order.status] ?? order.status })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-200 pt-4 mb-4", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mb-2", children: [
          /* @__PURE__ */ jsx("strong", { children: "Адрес доставки:" }),
          " ",
          order.delivery_address
        ] }),
        order.notes && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
          /* @__PURE__ */ jsx("strong", { children: "Примечания:" }),
          " ",
          order.notes
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2 mb-4", children: order.order_items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          item.products?.name || "Товар",
          " x ",
          item.quantity
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
          item.subtotal.toFixed(2),
          " MDL"
        ] })
      ] }, item.id)) }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-200 pt-4 flex justify-between items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Итого:" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xl font-bold text-yellow-600", children: [
          order.total_amount.toFixed(2),
          " MDL"
        ] })
      ] })
    ] }, order.id)) }),
    activeTab === "rentals" && /* @__PURE__ */ jsx("div", { className: "space-y-4", children: rentals.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-md p-12 text-center", children: [
      /* @__PURE__ */ jsx(Calendar, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Нет истории аренды" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onNavigate("equipment"),
          className: "mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition",
          children: "Просмотр оборудования"
        }
      )
    ] }) : rentals.map((rental) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-1", children: rental.equipment?.name || "Оборудование" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
            "Запрошено: ",
            new Date(rental.created_at ?? "").toLocaleDateString()
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`, children: RENTAL_STATUS_LABELS[rental.status] ?? rental.status })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4 mb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
            /* @__PURE__ */ jsx("strong", { children: "Дата начала:" }),
            " ",
            new Date(rental.start_date).toLocaleDateString()
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
            /* @__PURE__ */ jsx("strong", { children: "Дата окончания:" }),
            " ",
            new Date(rental.end_date).toLocaleDateString()
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
            /* @__PURE__ */ jsx("strong", { children: "Всего дней:" }),
            " ",
            rental.total_days
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
            /* @__PURE__ */ jsx("strong", { children: "Дневная ставка:" }),
            " ",
            rental.daily_rate.toFixed(2),
            " MDL"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
            /* @__PURE__ */ jsx("strong", { children: "Депозит:" }),
            " ",
            rental.deposit_paid.toFixed(2),
            " MDL"
          ] })
        ] })
      ] }),
      rental.notes && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mb-4", children: [
        /* @__PURE__ */ jsx("strong", { children: "Примечания:" }),
        " ",
        rental.notes
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-200 pt-4 flex justify-between items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Общая сумма:" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xl font-bold text-green-600", children: [
          rental.total_amount.toFixed(2),
          " MDL"
        ] })
      ] })
    ] }, rental.id)) })
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/pages/Contact.tsx");
function Contact() {
  return /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 py-12", children: [
    /* @__PURE__ */ jsx(
      Seo,
      {
        title: "Контакты",
        description: "Контакты DenAlex: адрес, телефоны и электронная почта.",
        path: "/kontakt"
      }
    ),
    /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-2", children: "Контакты" }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-500 mb-10", children: "Свяжитесь с нами любым удобным способом" }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(MapPin, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-800", children: "Адрес" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "с. Самурза Taraclia 7419" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Phone, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-800", children: "Телефон" }),
            /* @__PURE__ */ jsx("a", { href: "tel:+37378719072", className: "text-gray-500 hover:text-yellow-500 transition", children: "+373 78719072" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-800", children: "Часы работы" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Пн–Пт: 8:00 – 18:00" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Сб: 9:00 – 14:00" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Mail, { className: "w-5 h-5 text-yellow-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-800", children: "Email" }),
            /* @__PURE__ */ jsx("a", { href: "mailto:info@denalexshop.md", className: "text-gray-500 hover:text-yellow-500 transition", children: "info@denalexshop.md" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-gray-100 rounded-xl h-64 md:h-auto flex items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Карта — скоро" }) })
    ] })
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/pages/Login.tsx");
function Login() {
  const nav = useAppNav();
  const onSwitchToRegister = () => nav("register");
  const onLoginSuccess = () => nav("home");
  const onNavigate = nav;
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message);
      } else {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full bg-white rounded-2xl shadow-xl p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-brand rounded-full mb-4", children: /* @__PURE__ */ jsx(LogIn, { className: "w-8 h-8 text-gray-900" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-gray-900", children: "С возвращением" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-2", children: "Войдите в свой аккаунт" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-600 p-3 rounded-lg text-sm", children: error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Адрес электронной почты" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition",
              placeholder: "ваш@email.com",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Пароль" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition",
              placeholder: "Введите ваш пароль",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "w-full bg-brand text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed",
          children: loading ? "Выполняется вход..." : "Войти"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Нет аккаунта? " }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onSwitchToRegister,
              className: "text-brand-dark font-medium hover:text-brand transition",
              children: "Зарегистрироваться"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onNavigate("home"),
            className: "text-gray-500 font-medium hover:text-gray-700 transition text-sm",
            children: "Вернуться на главную"
          }
        ) })
      ] })
    ] })
  ] }) });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/pages/Register.tsx");
function Register() {
  const nav = useAppNav();
  const onSwitchToLogin = () => nav("login");
  const onNavigate = nav;
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать не менее 6 символов");
      return;
    }
    setLoading(true);
    const { error: signUpError } = await signUp(email, password, fullName);
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setEmailSent(true);
    }
  };
  if (emailSent) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-8 h-8 text-green-600" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Подтвердите email" }),
      /* @__PURE__ */ jsxs("p", { className: "text-gray-600 mb-2", children: [
        "Мы отправили письмо на ",
        /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900", children: email })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm mb-6", children: "Нажмите на ссылку в письме, чтобы активировать аккаунт, после чего сможете войти." }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onSwitchToLogin,
          className: "w-full bg-brand text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-dark transition",
          children: "Перейти ко входу"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => onNavigate("home"),
          className: "mt-3 w-full text-gray-500 text-sm hover:text-gray-700 transition",
          children: "Вернуться на главную"
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full bg-white rounded-2xl shadow-xl p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-brand rounded-full mb-4", children: /* @__PURE__ */ jsx(UserPlus, { className: "w-8 h-8 text-gray-900" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-gray-900", children: "Создать аккаунт" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-2", children: "Присоединяйтесь к порталу строительных материалов DenAlex" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
      error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-600 p-3 rounded-lg text-sm", children: error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Полное имя" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: fullName,
              onChange: (e) => setFullName(e.target.value),
              className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition",
              placeholder: "Иван Иванов",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Адрес электронной почты" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition",
              placeholder: "ваш@email.com",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Пароль" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition",
              placeholder: "Минимум 6 символов",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Подтвердите пароль" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              value: confirmPassword,
              onChange: (e) => setConfirmPassword(e.target.value),
              className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent transition",
              placeholder: "Подтвердите ваш пароль",
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "w-full bg-brand text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed",
          children: loading ? "Создание аккаунта..." : "Создать аккаунт"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "Уже есть аккаунт? " }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onSwitchToLogin,
              className: "text-brand-dark font-medium hover:text-brand transition",
              children: "Войти"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onNavigate("home"),
            className: "text-gray-500 font-medium hover:text-gray-700 transition text-sm",
            children: "Вернуться на главную"
          }
        ) })
      ] })
    ] })
  ] }) });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/components/ImageUpload.tsx");
function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  compact = false
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || null);
  const fileInputRef = useRef(null);
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Пожалуйста, выберите изображение");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Размер файла не должен превышать 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    await uploadImage(file);
  };
  const uploadImage = async (file) => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      onImageUploaded(publicUrl);
      alert("Изображение успешно загружено!");
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      alert(`Ошибка при загрузке изображения: ${error.message || "Неизвестная ошибка"}`);
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };
  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;
    setPreview(null);
    if (onImageRemoved) {
      onImageRemoved();
    }
    try {
      const urlParts = currentImageUrl.split("/product-images/");
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        await supabase.storage.from("product-images").remove([filePath]);
      }
    } catch (error) {
      console.error("Ошибка удаления файла:", error);
    }
  };
  const zoneH = compact ? "h-20" : "h-48";
  const iconSize = compact ? "w-8 h-8" : "w-16 h-16";
  return /* @__PURE__ */ jsxs("div", { className: compact ? "space-y-2" : "space-y-4", children: [
    preview ? /* @__PURE__ */ jsxs("div", { className: `relative w-full ${zoneH} bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300`, children: [
      /* @__PURE__ */ jsx("img", { src: preview, alt: "Preview", className: "w-full h-full object-cover" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleRemoveImage,
          className: "absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition",
          title: "Удалить изображение",
          children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
        }
      )
    ] }) : /* @__PURE__ */ jsx("div", { className: `w-full ${zoneH} bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center`, children: /* @__PURE__ */ jsx(Image, { className: `${iconSize} text-gray-400` }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: "image/*",
          onChange: handleFileSelect,
          className: "hidden",
          disabled: uploading
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => fileInputRef.current?.click(),
          disabled: uploading,
          className: "w-full bg-brand text-gray-900 px-4 py-2 rounded-lg hover:bg-brand-dark transition flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm",
          children: uploading ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" }),
            /* @__PURE__ */ jsx("span", { children: "Загрузка..." })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { children: preview ? "Изменить" : "Загрузить фото" })
          ] })
        }
      )
    ] }),
    !compact && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 text-center", children: "Допустимые форматы: JPG, PNG, GIF, WEBP. Максимальный размер: 5MB" })
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/pages/AdminDashboard.tsx");
function AdminDashboard() {
  const onNavigate = useAppNav();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(
    null
  );
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "product",
    image_url: ""
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    unit: "",
    stock_quantity: "",
    category_id: "",
    images: ["", "", "", ""]
  });
  const [newEquipment, setNewEquipment] = useState({
    name: "",
    description: "",
    daily_rate: "",
    deposit_amount: "",
    images: ["", "", "", ""],
    category_id: "",
    is_available: true
  });
  useEffect(() => {
    if (!isAdmin) {
      onNavigate("home");
      return;
    }
    loadData();
  }, [isAdmin, onNavigate]);
  const loadData = async () => {
    setLoading(true);
    const { data: categoriesData } = await supabase.from("categories").select("*").order("name");
    if (categoriesData) setCategories(categoriesData);
    const { data: productsData } = await supabase.from("products").select("*").order("name");
    if (productsData) setProducts(productsData);
    const { data: equipmentData } = await supabase.from("equipment").select("*").order("name");
    if (equipmentData) setEquipment(equipmentData);
    const { data: ordersData } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (ordersData) setOrders(ordersData);
    const { data: usersData } = await supabase.from("profiles").select("id, full_name, phone, is_admin, created_at").order("created_at", { ascending: false });
    if (usersData) setUsers(usersData);
    setLoading(false);
  };
  const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  const ORDER_STATUS_LABELS = {
    pending: "Ожидает",
    confirmed: "Подтверждён",
    shipped: "Отправлен",
    delivered: "Доставлен",
    cancelled: "Отменён"
  };
  const updateOrderStatus = async (orderId, status) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    const { data, error } = await supabase.from("categories").insert([{
      name: newCategory.name,
      type: newCategory.type,
      image_url: newCategory.image_url || null
    }]).select().single();
    if (error) {
      console.error("Error adding category:", error);
    } else if (data) {
      setCategories([...categories, data]);
      setNewCategory({ name: "", type: "product", image_url: "" });
    }
  };
  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    const { error } = await supabase.from("categories").update({
      name: editingCategory.name,
      type: editingCategory.type,
      image_url: editingCategory.image_url || null
    }).eq("id", editingCategory.id);
    if (error) {
      console.error("Error updating category:", error);
    } else {
      setCategories(
        categories.map(
          (cat) => cat.id === editingCategory.id ? editingCategory : cat
        )
      );
      setEditingCategory(null);
    }
  };
  const handleDeleteCategory = async (id) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      console.error("Error deleting category:", error);
    } else {
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };
  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) return;
    const { data, error } = await supabase.from("products").insert([
      {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price) || 0,
        unit: newProduct.unit,
        stock_quantity: parseInt(newProduct.stock_quantity) || 0,
        category_id: newProduct.category_id,
        images: newProduct.images.filter((url) => url !== ""),
        image_url: newProduct.images[0] || null,
        is_active: true
      }
    ]).select().single();
    if (error) {
      console.error("Error adding product:", error);
    } else if (data) {
      setProducts([...products, data]);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        unit: "",
        stock_quantity: "",
        category_id: "",
        images: ["", "", "", ""]
      });
    }
  };
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    const { error } = await supabase.from("products").update({
      name: editingProduct.name,
      description: editingProduct.description,
      price: editingProduct.price,
      unit: editingProduct.unit,
      stock_quantity: editingProduct.stock_quantity,
      category_id: editingProduct.category_id,
      image_url: editingProduct.image_url,
      is_active: editingProduct.is_active
    }).eq("id", editingProduct.id);
    if (error) {
      console.error("Error updating product:", error);
    } else {
      setProducts(
        products.map(
          (prod) => prod.id === editingProduct.id ? editingProduct : prod
        )
      );
      setEditingProduct(null);
    }
  };
  const handleDeleteProduct = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Error deleting product:", error);
    } else {
      setProducts(products.filter((prod) => prod.id !== id));
    }
  };
  const handleAddEquipment = async () => {
    if (!newEquipment.name.trim()) return;
    const { data, error } = await supabase.from("equipment").insert([
      {
        name: newEquipment.name,
        description: newEquipment.description,
        daily_rate: parseFloat(newEquipment.daily_rate) || 0,
        deposit_amount: parseFloat(newEquipment.deposit_amount) || 0,
        images: newEquipment.images.filter((url) => url !== ""),
        image_url: newEquipment.images[0] || null,
        category_id: newEquipment.category_id || null,
        is_available: newEquipment.is_available
      }
    ]).select().single();
    if (error) {
      console.error("Error adding equipment:", error);
    } else if (data) {
      setEquipment([...equipment, data]);
      setNewEquipment({
        name: "",
        description: "",
        daily_rate: "",
        deposit_amount: "",
        images: ["", "", "", ""],
        category_id: "",
        is_available: true
      });
    }
  };
  const handleUpdateEquipment = async () => {
    if (!editingEquipment) return;
    const { error } = await supabase.from("equipment").update({
      name: editingEquipment.name,
      description: editingEquipment.description,
      daily_rate: editingEquipment.daily_rate,
      deposit_amount: editingEquipment.deposit_amount,
      image_url: editingEquipment.image_url,
      category_id: editingEquipment.category_id,
      is_available: editingEquipment.is_available
    }).eq("id", editingEquipment.id);
    if (error) {
      console.error("Error updating equipment:", error);
    } else {
      setEquipment(
        equipment.map(
          (eq) => eq.id === editingEquipment.id ? editingEquipment : eq
        )
      );
      setEditingEquipment(null);
    }
  };
  const handleDeleteEquipment = async (id) => {
    const { count, error: countError } = await supabase.from("rentals").select("id", { count: "exact", head: true }).eq("equipment_id", id);
    if (countError) {
      console.error("Error checking rentals:", countError);
      alert("Не удалось проверить аренды: " + countError.message);
      return;
    }
    if (count && count > 0) {
      const confirmArchive = window.confirm(
        `Это оборудование используется в ${count} аренде(ах). Полное удаление невозможно — история аренд будет потеряна.

Скрыть оборудование из каталога вместо удаления?`
      );
      if (!confirmArchive) return;
      const { error: error2 } = await supabase.from("equipment").update({ is_archived: true, is_available: false }).eq("id", id);
      if (error2) {
        console.error("Error archiving equipment:", error2);
        alert("Ошибка при архивации: " + error2.message);
        return;
      }
      setEquipment((prev) => prev.filter((eq) => eq.id !== id));
      return;
    }
    const confirmDelete = window.confirm(
      "Удалить оборудование безвозвратно?"
    );
    if (!confirmDelete) return;
    const { error } = await supabase.from("equipment").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        alert(
          "Оборудование связано с другими записями и не может быть удалено. Используйте архивацию."
        );
      } else {
        console.error("Error deleting equipment:", error);
        alert("Ошибка при удалении: " + error.message);
      }
      return;
    }
    setEquipment((prev) => prev.filter((eq) => eq.id !== id));
  };
  if (!isAdmin) {
    return null;
  }
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-slate-50 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Загрузка панели администратора..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onNavigate("home"),
          className: "flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5" }),
            /* @__PURE__ */ jsx("span", { children: "Вернуться на главную" })
          ]
        }
      ),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Панель администратора" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200", children: /* @__PURE__ */ jsxs("nav", { className: "flex -mb-px", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("categories"),
            className: `py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === "categories" ? "border-brand text-yellow-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,
            children: [
              /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: "Категории" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("products"),
            className: `py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === "products" ? "border-brand text-yellow-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,
            children: [
              /* @__PURE__ */ jsx(Package, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: "Товары" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("equipment"),
            className: `py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === "equipment" ? "border-brand text-yellow-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,
            children: [
              /* @__PURE__ */ jsx(Wrench, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: "Оборудование" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("orders"),
            className: `py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === "orders" ? "border-brand text-yellow-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,
            children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: "Заказы" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("users"),
            className: `py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === "users" ? "border-brand text-yellow-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,
            children: [
              /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: "Пользователи" })
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
        activeTab === "categories" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Управление категориями" }),
            /* @__PURE__ */ jsxs("div", { className: "flex space-x-4", children: [
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: newCategory.type,
                  onChange: (e) => setNewCategory({
                    ...newCategory,
                    type: e.target.value
                  }),
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "product", children: "Товары" }),
                    /* @__PURE__ */ jsx("option", { value: "equipment", children: "Оборудование" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: newCategory.name,
                    onChange: (e) => setNewCategory({ ...newCategory, name: e.target.value }),
                    placeholder: "Название категории",
                    className: "border border-gray-300 rounded-lg px-3 py-2 text-sm w-72"
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "w-36 shrink-0", children: /* @__PURE__ */ jsx(
                  ImageUpload,
                  {
                    compact: true,
                    currentImageUrl: newCategory.image_url,
                    onImageUploaded: (url) => setNewCategory({ ...newCategory, image_url: url }),
                    onImageRemoved: () => setNewCategory({ ...newCategory, image_url: "" })
                  }
                ) }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleAddCategory,
                    className: "bg-brand text-gray-900 px-4 py-2 rounded-lg hover:bg-brand-dark transition flex items-center space-x-1 shrink-0",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                      /* @__PURE__ */ jsx("span", { children: "Добавить" })
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "ID" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Название" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Тип" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Изображение" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Действия" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: categories.map((category) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: category.id.slice(0, 8) }),
              editingCategory?.id === category.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: editingCategory.name,
                    onChange: (e) => setEditingCategory({
                      ...editingCategory,
                      name: e.target.value
                    }),
                    className: "border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: editingCategory.type,
                    onChange: (e) => setEditingCategory({
                      ...editingCategory,
                      type: e.target.value
                    }),
                    className: "border border-gray-300 rounded-lg px-3 py-1 text-sm",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "product", children: "Товары" }),
                      /* @__PURE__ */ jsx("option", { value: "equipment", children: "Оборудование" })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "w-48", children: /* @__PURE__ */ jsx(
                  ImageUpload,
                  {
                    currentImageUrl: editingCategory?.image_url || "",
                    onImageUploaded: (url) => setEditingCategory({ ...editingCategory, image_url: url }),
                    onImageRemoved: () => setEditingCategory({ ...editingCategory, image_url: null })
                  }
                ) }) }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: handleUpdateCategory,
                      className: "text-green-600 hover:text-green-900 mr-2",
                      children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setEditingCategory(null),
                      className: "text-gray-600 hover:text-gray-900",
                      children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                    }
                  )
                ] })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: category.name }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize", children: category.type }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: category.image_url ? /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: category.image_url,
                    alt: category.name,
                    className: "w-12 h-12 object-cover rounded-lg"
                  }
                ) : /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-gray-400 text-xs", children: "Нет" }) }) }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setEditingCategory(category),
                      className: "text-yellow-600 hover:text-yellow-800 mr-2",
                      children: /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleDeleteCategory(category.id),
                      className: "text-red-600 hover:text-red-900",
                      children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                    }
                  )
                ] })
              ] })
            ] }, category.id)) })
          ] }) })
        ] }),
        activeTab === "products" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Добавить новый товар" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-start", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: newProduct.name,
                  onChange: (e) => setNewProduct({ ...newProduct, name: e.target.value }),
                  placeholder: "Название",
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: newProduct.description,
                  onChange: (e) => setNewProduct({
                    ...newProduct,
                    description: e.target.value
                  }),
                  placeholder: "Описание",
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: newProduct.price,
                  onChange: (e) => setNewProduct({ ...newProduct, price: e.target.value }),
                  placeholder: "Цена (MDL)",
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: newProduct.unit,
                  onChange: (e) => setNewProduct({ ...newProduct, unit: e.target.value }),
                  placeholder: "Единица измерения",
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: newProduct.stock_quantity,
                  onChange: (e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value }),
                  placeholder: "Количество на складе",
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm"
                }
              ),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: newProduct.category_id,
                  onChange: (e) => setNewProduct({
                    ...newProduct,
                    category_id: e.target.value
                  }),
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Выберите категорию" }),
                    categories.filter((c) => c.type === "product").map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.name }, c.id))
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2", children: [0, 1, 2, 3].map((index) => /* @__PURE__ */ jsx(
                ImageUpload,
                {
                  currentImageUrl: newProduct.images[index],
                  onImageUploaded: (url) => {
                    const images = [...newProduct.images];
                    images[index] = url;
                    setNewProduct({ ...newProduct, images });
                  },
                  onImageRemoved: () => {
                    const images = [...newProduct.images];
                    images[index] = "";
                    setNewProduct({ ...newProduct, images });
                  }
                },
                index
              )) })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleAddProduct,
                className: "bg-brand text-gray-900 px-4 py-2 rounded-lg hover:bg-brand-dark transition flex items-center space-x-1",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsx("span", { children: "Добавить товар" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "ID" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Название" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Цена" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Кол-во" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Статус" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Действия" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: products.map((product) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: product.id.slice(0, 8) }),
              editingProduct?.id === product.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: editingProduct.name,
                    onChange: (e) => setEditingProduct({
                      ...editingProduct,
                      name: e.target.value
                    }),
                    className: "border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: editingProduct.price,
                    onChange: (e) => setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value) || 0
                    }),
                    className: "border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: editingProduct.stock_quantity,
                    onChange: (e) => setEditingProduct({
                      ...editingProduct,
                      stock_quantity: parseInt(e.target.value) || 0
                    }),
                    className: "border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: editingProduct.is_active ? "active" : "inactive",
                    onChange: (e) => setEditingProduct({
                      ...editingProduct,
                      is_active: e.target.value === "active"
                    }),
                    className: "border border-gray-300 rounded-lg px-3 py-1 text-sm",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "active", children: "Активен" }),
                      /* @__PURE__ */ jsx("option", { value: "inactive", children: "Неактивен" })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: handleUpdateProduct,
                      className: "text-green-600 hover:text-green-900 mr-2",
                      children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setEditingProduct(null),
                      className: "text-gray-600 hover:text-gray-900",
                      children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                    }
                  )
                ] })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: product.name }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: [
                  product.price.toFixed(2),
                  " MDL"
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: product.stock_quantity }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`,
                    children: product.is_active ? "Активен" : "Неактивен"
                  }
                ) }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setEditingProduct(product),
                      className: "text-yellow-600 hover:text-yellow-800 mr-2",
                      children: /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleDeleteProduct(product.id),
                      className: "text-red-600 hover:text-red-900",
                      children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                    }
                  )
                ] })
              ] })
            ] }, product.id)) })
          ] }) })
        ] }),
        activeTab === "equipment" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Добавить новое оборудование" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-start", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: newEquipment.name,
                  onChange: (e) => setNewEquipment({ ...newEquipment, name: e.target.value }),
                  placeholder: "Название",
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: newEquipment.description,
                  onChange: (e) => setNewEquipment({
                    ...newEquipment,
                    description: e.target.value
                  }),
                  placeholder: "Описание",
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: newEquipment.daily_rate,
                  onChange: (e) => setNewEquipment({ ...newEquipment, daily_rate: e.target.value }),
                  placeholder: "Дневная ставка (MDL)",
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: newEquipment.deposit_amount,
                  onChange: (e) => setNewEquipment({ ...newEquipment, deposit_amount: e.target.value }),
                  placeholder: "Депозит (MDL)",
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm"
                }
              ),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: newEquipment.category_id,
                  onChange: (e) => setNewEquipment({
                    ...newEquipment,
                    category_id: e.target.value
                  }),
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Выберите категорию" }),
                    categories.filter((c) => c.type === "equipment").map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.name }, c.id))
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: newEquipment.is_available ? "available" : "unavailable",
                  onChange: (e) => setNewEquipment({
                    ...newEquipment,
                    is_available: e.target.value === "available"
                  }),
                  className: "border border-gray-300 rounded-lg px-3 py-2 text-sm",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "available", children: "Доступно" }),
                    /* @__PURE__ */ jsx("option", { value: "unavailable", children: "Недоступно" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2", children: [0, 1, 2, 3].map((index) => /* @__PURE__ */ jsx(
                ImageUpload,
                {
                  currentImageUrl: newEquipment.images[index],
                  onImageUploaded: (url) => {
                    const images = [...newEquipment.images];
                    images[index] = url;
                    setNewEquipment({ ...newEquipment, images });
                  },
                  onImageRemoved: () => {
                    const images = [...newEquipment.images];
                    images[index] = "";
                    setNewEquipment({ ...newEquipment, images });
                  }
                },
                index
              )) })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleAddEquipment,
                className: "bg-brand text-gray-900 px-4 py-2 rounded-lg hover:bg-brand-dark transition flex items-center space-x-1",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsx("span", { children: "Добавить оборудование" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "ID" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Название" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Дневная ставка" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Депозит" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Статус" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Действия" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: equipment.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: item.id.slice(0, 8) }),
              editingEquipment?.id === item.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: editingEquipment.name,
                    onChange: (e) => setEditingEquipment({
                      ...editingEquipment,
                      name: e.target.value
                    }),
                    className: "border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: editingEquipment.daily_rate,
                    onChange: (e) => setEditingEquipment({
                      ...editingEquipment,
                      daily_rate: parseFloat(e.target.value) || 0
                    }),
                    className: "border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: editingEquipment.deposit_amount,
                    onChange: (e) => setEditingEquipment({
                      ...editingEquipment,
                      deposit_amount: parseFloat(e.target.value) || 0
                    }),
                    className: "border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: editingEquipment.is_available ? "available" : "unavailable",
                    onChange: (e) => setEditingEquipment({
                      ...editingEquipment,
                      is_available: e.target.value === "available"
                    }),
                    className: "border border-gray-300 rounded-lg px-3 py-1 text-sm",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "available", children: "Доступно" }),
                      /* @__PURE__ */ jsx("option", { value: "unavailable", children: "Недоступно" })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: handleUpdateEquipment,
                      className: "text-green-600 hover:text-green-900 mr-2",
                      children: /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setEditingEquipment(null),
                      className: "text-gray-600 hover:text-gray-900",
                      children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
                    }
                  )
                ] })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: item.name }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: [
                  item.daily_rate.toFixed(2),
                  " MDL"
                ] }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: [
                  item.deposit_amount.toFixed(2),
                  " MDL"
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`,
                    children: item.is_available ? "Доступно" : "Недоступно"
                  }
                ) }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setEditingEquipment(item),
                      className: "text-yellow-600 hover:text-yellow-800 mr-2",
                      children: /* @__PURE__ */ jsx(Edit, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleDeleteEquipment(item.id),
                      className: "text-red-600 hover:text-red-900",
                      children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                    }
                  )
                ] })
              ] })
            ] }, item.id)) })
          ] }) })
        ] }),
        activeTab === "orders" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-6", children: "Заказы" }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "ID заказа" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Пользователь" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Дата" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Сумма" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Статус" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: orders.map((order) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: order.id.slice(0, 8) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: order.user_id.slice(0, 8) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: new Date(order.created_at ?? "").toLocaleDateString() }),
              /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: [
                order.total_amount.toFixed(2),
                " MDL"
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsx(
                "select",
                {
                  value: order.status,
                  onChange: (e) => updateOrderStatus(order.id, e.target.value),
                  className: "text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-brand focus:border-transparent",
                  children: ORDER_STATUSES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: ORDER_STATUS_LABELS[s] }, s))
                }
              ) })
            ] }, order.id)) })
          ] }) })
        ] }),
        activeTab === "users" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-6", children: "Пользователи" }),
          /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "ID" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Имя" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Телефон" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Роль" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Дата регистрации" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: users.map((user) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: user.id.slice(0, 8) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: user.full_name ?? "—" }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: user.phone ?? "—" }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm", children: user.is_admin ? /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700", children: "Админ" }) : /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600", children: "Пользователь" }) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: new Date(user.created_at).toLocaleDateString() })
            ] }, user.id)) })
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/lib/productLoader.ts");
async function productLoader({ params }) {
  const slug = params.slug;
  if (!slug) return { product: null, category: null };
  try {
    const { data: product, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
    if (error) throw new Error(`productLoader(${slug}): ${error.message}`);
    if (!product) return { product: null, category: null };
    let category = null;
    if (product.category_id) {
      const { data } = await supabase.from("categories").select("*").eq("id", product.category_id).maybeSingle();
      category = data;
    }
    return { product, category };
  } catch {
    return { product: null, category: null };
  }
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/lib/catalogLoader.ts");
async function catalogLoader({ params }) {
  try {
    const { data: catData, error: catError } = await supabase.from("categories").select("*").eq("type", "product").order("name");
    if (catError) throw new Error(`catalogLoader(categories): ${catError.message}`);
    const categories = catData ?? [];
    const category = params.slug ? categories.find((c) => c.slug === params.slug) ?? null : null;
    let query = supabase.from("products").select("*").eq("is_active", true).order("name");
    if (category) query = query.eq("category_id", category.id);
    const { data: prodData, error: prodError } = await query;
    if (prodError) throw new Error(`catalogLoader(products): ${prodError.message}`);
    return { categories, category, products: prodData ?? [] };
  } catch {
    return { categories: [], category: null, products: [] };
  }
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/lib/equipmentLoader.ts");
async function equipmentLoader({ params }) {
  try {
    const { data: catData, error: catError } = await supabase.from("categories").select("*").eq("type", "equipment").order("name");
    if (catError) throw new Error(`equipmentLoader(categories): ${catError.message}`);
    const categories = catData ?? [];
    const category = params.slug ? categories.find((c) => c.slug === params.slug) ?? null : null;
    let query = supabase.from("equipment").select("*").eq("is_available", true).eq("is_archived", false).order("name");
    if (category) query = query.eq("category_id", category.id);
    const { data, error } = await query;
    if (error) throw new Error(`equipmentLoader(equipment): ${error.message}`);
    return { categories, category, equipment: data ?? [] };
  } catch {
    return { categories: [], category: null, equipment: [] };
  }
}
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/router.tsx");
function Providers() {
  return /* @__PURE__ */ jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsx(Head, { children: /* @__PURE__ */ jsx("title", { children: "DenAlex — строительные материалы и аренда оборудования" }) }),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function MainLayout() {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col bg-slate-50", children: [
    /* @__PURE__ */ jsx(ScrollToTop, {}),
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-grow", children: /* @__PURE__ */ jsx(Outlet, {}) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
async function getCategorySlugs(type) {
  const { data, error } = await supabase.from("categories").select("slug").eq("type", type);
  if (error) throw new Error(`getCategorySlugs(${type}): ${error.message}`);
  return data.map((c) => c.slug).filter(Boolean);
}
async function getProductSlugs() {
  const { data, error } = await supabase.from("products").select("slug").eq("is_active", true);
  if (error) throw new Error(`getProductSlugs: ${error.message}`);
  return data.map((p) => p.slug).filter(Boolean);
}
const routes = [
  {
    element: /* @__PURE__ */ jsx(Providers, {}),
    children: [
      {
        element: /* @__PURE__ */ jsx(MainLayout, {}),
        children: [
          { path: "/", element: /* @__PURE__ */ jsx(Home, {}) },
          { path: "/catalog", element: /* @__PURE__ */ jsx(Products, {}), loader: catalogLoader },
          {
            path: "/catalog/:slug",
            element: /* @__PURE__ */ jsx(Products, {}),
            loader: catalogLoader,
            async getStaticPaths() {
              const slugs = await getCategorySlugs("product");
              return slugs.map((s) => `/catalog/${s}`);
            }
          },
          {
            path: "/tovar/:slug",
            element: /* @__PURE__ */ jsx(ProductDetail, {}),
            loader: productLoader,
            async getStaticPaths() {
              const slugs = await getProductSlugs();
              return slugs.map((s) => `/tovar/${s}`);
            }
          },
          { path: "/arenda-tehniki", element: /* @__PURE__ */ jsx(EquipmentPage, {}), loader: equipmentLoader },
          {
            path: "/arenda-tehniki/:slug",
            element: /* @__PURE__ */ jsx(EquipmentPage, {}),
            loader: equipmentLoader,
            async getStaticPaths() {
              const slugs = await getCategorySlugs("equipment");
              return slugs.map((s) => `/arenda-tehniki/${s}`);
            }
          },
          { path: "/korzina", element: /* @__PURE__ */ jsx(Cart, {}) },
          { path: "/kabinet", element: /* @__PURE__ */ jsx(Cabinet, {}) },
          { path: "/kontakt", element: /* @__PURE__ */ jsx(Contact, {}) }
        ]
      },
      { path: "/vkhod", element: /* @__PURE__ */ jsx(Login, {}) },
      { path: "/registraciya", element: /* @__PURE__ */ jsx(Register, {}) },
      { path: "/admin", element: /* @__PURE__ */ jsx(AdminDashboard, {}) },
      { path: "*", element: /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true }) }
    ]
  }
];
globalThis.__VITE_REACT_SSG_TRACK_SSR_MODULE__?.("src/main.tsx");
const createRoot = ViteReactSSG({ routes });
export {
  createRoot
};
