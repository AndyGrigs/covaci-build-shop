import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Package,
  Wrench,
  Tag,
  Users,
  FileText,
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  ArrowLeft,
} from "lucide-react";
import type { Database } from "../types/database";
import ImageUpload from "../components/ImageUpload";

// Types for our data
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type Equipment = Database["public"]["Tables"]["equipment"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type UserRow = { id: string; email: string; created_at: string };

export default function AdminDashboard({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "categories" | "products" | "equipment" | "orders" | "users"
  >("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null,
  );
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "product" as "product" | "equipment",
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    unit: "",
    stock_quantity: 0,
    category_id: "",
    image_url: "",
  });
  const [newEquipment, setNewEquipment] = useState({
    name: "",
    description: "",
    daily_rate: 0,
    deposit_amount: 0,
    image_url: "",
    category_id: "",
    is_available: true,
  });

  useEffect(() => {
    if (!isAdmin) {
      onNavigate("home");
      return;
    }
    loadData();
  }, [isAdmin, onNavigate]);

  // Note: In a production app, you should also validate admin permissions on the server side
  // by creating an admin-only API endpoint that validates admin status before returning data

  const loadData = async () => {
    setLoading(true);

    // Load categories
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (categoriesData) setCategories(categoriesData);

    // Load products
    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (productsData) setProducts(productsData);

    // Load equipment
    const { data: equipmentData } = await supabase
      .from("equipment")
      .select("*")
      .order("name");
    if (equipmentData) setEquipment(equipmentData);

    // Load orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (ordersData) setOrders(ordersData);

    // Load users (just basic info for admin)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: usersData } = await (supabase as any)
      .from("users")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });
    if (usersData) setUsers(usersData as UserRow[]);

    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name: newCategory.name, type: newCategory.type }])
      .select()
      .single();

    if (error) {
      console.error("Error adding category:", error);
    } else if (data) {
      setCategories([...categories, data]);
      setNewCategory({ name: "", type: "product" });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    const { error } = await supabase
      .from("categories")
      .update({ name: editingCategory.name, type: editingCategory.type })
      .eq("id", editingCategory.id);

    if (error) {
      console.error("Error updating category:", error);
    } else {
      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id ? editingCategory : cat,
        ),
      );
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
    } else {
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) return;

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          unit: newProduct.unit,
          stock_quantity: newProduct.stock_quantity,
          category_id: newProduct.category_id,
          image_url: newProduct.image_url,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding product:", error);
    } else if (data) {
      setProducts([...products, data]);
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        unit: "",
        stock_quantity: 0,
        category_id: "",
        image_url: "",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    const { error } = await supabase
      .from("products")
      .update({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        unit: editingProduct.unit,
        stock_quantity: editingProduct.stock_quantity,
        category_id: editingProduct.category_id,
        image_url: editingProduct.image_url,
        is_active: editingProduct.is_active,
      })
      .eq("id", editingProduct.id);

    if (error) {
      console.error("Error updating product:", error);
    } else {
      setProducts(
        products.map((prod) =>
          prod.id === editingProduct.id ? editingProduct : prod,
        ),
      );
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
    } else {
      setProducts(products.filter((prod) => prod.id !== id));
    }
  };

  const handleAddEquipment = async () => {
    if (!newEquipment.name.trim()) return;

    const { data, error } = await supabase
      .from("equipment")
      .insert([
        {
          name: newEquipment.name,
          description: newEquipment.description,
          daily_rate: newEquipment.daily_rate,
          deposit_amount: newEquipment.deposit_amount,
          image_url: newEquipment.image_url,
          category_id: newEquipment.category_id,
          is_available: newEquipment.is_available,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding equipment:", error);
    } else if (data) {
      setEquipment([...equipment, data]);
      setNewEquipment({
        name: "",
        description: "",
        daily_rate: 0,
        deposit_amount: 0,
        image_url: "",
        category_id: "",
        is_available: true,
      });
    }
  };

  const handleUpdateEquipment = async () => {
    if (!editingEquipment) return;

    const { error } = await supabase
      .from("equipment")
      .update({
        name: editingEquipment.name,
        description: editingEquipment.description,
        daily_rate: editingEquipment.daily_rate,
        deposit_amount: editingEquipment.deposit_amount,
        image_url: editingEquipment.image_url,
        category_id: editingEquipment.category_id,
        is_available: editingEquipment.is_available,
      })
      .eq("id", editingEquipment.id);

    if (error) {
      console.error("Error updating equipment:", error);
    } else {
      setEquipment(
        equipment.map((eq) =>
          eq.id === editingEquipment.id ? editingEquipment : eq,
        ),
      );
      setEditingEquipment(null);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    const { error } = await supabase.from("equipment").delete().eq("id", id);

    if (error) {
      console.error("Error deleting equipment:", error);
    } else {
      setEquipment(equipment.filter((eq) => eq.id !== id));
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка панели администратора...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Вернуться на главную</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Панель администратора
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Admin Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("categories")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "categories"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Категории</span>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "products"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Товары</span>
            </button>
            <button
              onClick={() => setActiveTab("equipment")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "equipment"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Оборудование</span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "orders"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Заказы</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Пользователи</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Управление категориями
                </h2>
                <div className="flex space-x-4">
                  <select
                    value={newCategory.type}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        type: e.target.value as "product" | "equipment",
                      })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="product">Товары</option>
                    <option value="equipment">Оборудование</option>
                  </select>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      placeholder="Название категории"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48"
                    />
                    <button
                      onClick={handleAddCategory}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Добавить</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Название
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Тип
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.id.slice(0, 8)}
                        </td>
                        {editingCategory?.id === category.id ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={editingCategory.name}
                                onChange={(e) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    name: e.target.value,
                                  })
                                }
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={editingCategory.type}
                                onChange={(e) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    type: e.target.value as
                                      | "product"
                                      | "equipment",
                                  })
                                }
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                              >
                                <option value="product">Товары</option>
                                <option value="equipment">Оборудование</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={handleUpdateCategory}
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingCategory(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {category.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {category.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setEditingCategory(category)}
                                className="text-blue-600 hover:text-blue-900 mr-2"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCategory(category.id)
                                }
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Добавить новый товар
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    placeholder="Название"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                    placeholder="Описание"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Цена"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unit: e.target.value })
                    }
                    placeholder="Единица измерения"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stock_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Количество на складе"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <select
                    value={newProduct.category_id}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category_id: e.target.value,
                      })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Выберите категорию</option>
                    {categories
                      .filter((c) => c.type === "product")
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  {/* <input
                    type="text"
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                    placeholder="URL изображения"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
                  /> */}
                  <div className="col-span-2">
                    <ImageUpload
                      currentImageUrl={newProduct.image_url}
                      onImageUploaded={(url) =>
                        setNewProduct({ ...newProduct, image_url: url })
                      }
                      onImageRemoved={() =>
                        setNewProduct({ ...newProduct, image_url: "" })
                      }
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddProduct}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить товар</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Название
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Цена
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Кол-во
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.id.slice(0, 8)}
                        </td>
                        {editingProduct?.id === product.id ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={editingProduct.name}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    name: e.target.value,
                                  })
                                }
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                value={editingProduct.price}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    price: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                value={editingProduct.stock_quantity}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    stock_quantity:
                                      parseInt(e.target.value) || 0,
                                  })
                                }
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={
                                  editingProduct.is_active
                                    ? "active"
                                    : "inactive"
                                }
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    is_active: e.target.value === "active",
                                  })
                                }
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                              >
                                <option value="active">Активен</option>
                                <option value="inactive">Неактивен</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={handleUpdateProduct}
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingProduct(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${product.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.stock_quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  product.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {product.is_active ? "Активен" : "Неактивен"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setEditingProduct(product)}
                                className="text-blue-600 hover:text-blue-900 mr-2"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === "equipment" && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Добавить новое оборудование
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <input
                    type="text"
                    value={newEquipment.name}
                    onChange={(e) =>
                      setNewEquipment({ ...newEquipment, name: e.target.value })
                    }
                    placeholder="Название"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={newEquipment.description}
                    onChange={(e) =>
                      setNewEquipment({
                        ...newEquipment,
                        description: e.target.value,
                      })
                    }
                    placeholder="Описание"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={newEquipment.daily_rate}
                    onChange={(e) =>
                      setNewEquipment({
                        ...newEquipment,
                        daily_rate: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Дневная ставка"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={newEquipment.deposit_amount}
                    onChange={(e) =>
                      setNewEquipment({
                        ...newEquipment,
                        deposit_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Депозит"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <select
                    value={newEquipment.category_id}
                    onChange={(e) =>
                      setNewEquipment({
                        ...newEquipment,
                        category_id: e.target.value,
                      })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Выберите категорию</option>
                    {categories
                      .filter((c) => c.type === "equipment")
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <select
                    value={
                      newEquipment.is_available ? "available" : "unavailable"
                    }
                    onChange={(e) =>
                      setNewEquipment({
                        ...newEquipment,
                        is_available: e.target.value === "available",
                      })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="available">Доступно</option>
                    <option value="unavailable">Недоступно</option>
                  </select>
                  {/* <input
                    type="text"
                    value={newEquipment.image_url}
                    onChange={(e) =>
                      setNewEquipment({
                        ...newEquipment,
                        image_url: e.target.value,
                      })
                    }
                    placeholder="URL изображения"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
                  /> */}
                  <div className="col-span-2">
                    <ImageUpload
                      currentImageUrl={newEquipment.image_url}
                      onImageUploaded={(url) =>
                        setNewEquipment({ ...newEquipment, image_url: url })
                      }
                      onImageRemoved={() =>
                        setNewEquipment({ ...newEquipment, image_url: "" })
                      }
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddEquipment}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить оборудование</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Название
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дневная ставка
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Депозит
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipment.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.id.slice(0, 8)}
                        </td>
                        {editingEquipment?.id === item.id ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={editingEquipment.name}
                                onChange={(e) =>
                                  setEditingEquipment({
                                    ...editingEquipment,
                                    name: e.target.value,
                                  })
                                }
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                value={editingEquipment.daily_rate}
                                onChange={(e) =>
                                  setEditingEquipment({
                                    ...editingEquipment,
                                    daily_rate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                value={editingEquipment.deposit_amount}
                                onChange={(e) =>
                                  setEditingEquipment({
                                    ...editingEquipment,
                                    deposit_amount:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={
                                  editingEquipment.is_available
                                    ? "available"
                                    : "unavailable"
                                }
                                onChange={(e) =>
                                  setEditingEquipment({
                                    ...editingEquipment,
                                    is_available:
                                      e.target.value === "available",
                                  })
                                }
                                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                              >
                                <option value="available">Доступно</option>
                                <option value="unavailable">Недоступно</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={handleUpdateEquipment}
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingEquipment(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${item.daily_rate.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${item.deposit_amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.is_available
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.is_available ? "Доступно" : "Недоступно"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setEditingEquipment(item)}
                                className="text-blue-600 hover:text-blue-900 mr-2"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEquipment(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Заказы
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID заказа
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Пользователь
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сумма
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.user_id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${order.total_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Пользователи
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата регистрации
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
