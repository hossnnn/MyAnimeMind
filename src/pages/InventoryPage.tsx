import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Star, Palette, Trophy, Zap, CheckCircle2, Shield, Lock, X } from 'lucide-react';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  type: string;
}

const shopItems: ShopItem[] = [
  {
    id: 'banner',
    name: 'Custom Profile Banner',
    description: 'Upload a custom banner image for your profile page',
    price: 500,
    icon: <Palette className="w-8 h-8 text-purple-400" />,
    type: 'banner',
  },
  {
    id: 'animated_avatar',
    name: 'Animated Avatar',
    description: 'Add a glowing animation effect to your avatar',
    price: 750,
    icon: <Zap className="w-8 h-8 text-blue-400" />,
    type: 'avatar_effect',
  },
  {
    id: 'profile_border',
    name: 'Special Profile Border',
    description: 'Add a stylish animated border around your avatar',
    price: 1000,
    icon: <Star className="w-8 h-8 text-yellow-400" />,
    type: 'border_style',
  },
  {
    id: 'theme_color',
    name: 'Custom Theme Color',
    description: 'Choose a custom accent color for your profile',
    price: 250,
    icon: <Palette className="w-8 h-8 text-pink-400" />,
    type: 'theme_color',
  },
  {
    id: 'legendary_badge',
    name: '"Legendary Watcher" Badge',
    description: 'Show off your dedication with this exclusive badge',
    price: 5000,
    icon: <Trophy className="w-8 h-8 text-yellow-500" />,
    type: 'badge',
  },
];

export default function InventoryPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: purchaseData } = await supabase
        .from('user_purchases')
        .select('item_type')
        .eq('user_id', user!.id);

      const { data: equippedData } = await supabase
        .from('equipped_items')
        .select('item_type')
        .eq('user_id', user!.id);

      if (purchaseData) {
        setPurchases(purchaseData.map((p) => p.item_type as string));
      }

      if (equippedData) {
        const equippedMap: Record<string, boolean> = {};
        equippedData.forEach((e) => {
          equippedMap[e.item_type as string] = true;
        });
        setEquipped(equippedMap);
      }
    } catch {
      // Silently handle errors
    }
    setLoading(false);
  };

  const equipItem = async (itemType: string) => {
    if (!user) return;

    // Insert equipped item (will replace existing due to unique constraint)
    const { error } = await supabase.from('equipped_items').upsert({
      user_id: user.id,
      item_type: itemType,
      item_data: { equipped_at: new Date().toISOString() },
    }, { onConflict: 'user_id,item_type' });

    if (!error) {
      setEquipped((prev) => ({ ...prev, [itemType]: true }));
      setMessage(`${shopItems.find((i) => i.type === itemType)?.name} equipped!`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const unequipItem = async (itemType: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('equipped_items')
      .delete()
      .eq('user_id', user.id)
      .eq('item_type', itemType);

    if (!error) {
      setEquipped((prev) => {
        const next = { ...prev };
        delete next[itemType];
        return next;
      });
      setMessage(`${shopItems.find((i) => i.type === itemType)?.name} unequipped.`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-lg">Sign in to view your inventory</p>
        </div>
      </div>
    );
  }

  const ownedItems = shopItems.filter((item) => purchases.includes(item.type));

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-indigo-400" />
              My Inventory
            </h1>
            <p className="text-slate-400">Manage your purchased items and equip them to your profile</p>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-center animate-fadeIn">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading inventory...</p>
          </div>
        ) : ownedItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg mb-4">You haven't purchased any items yet</p>
            <a href="/shop" className="btn btn-primary">
              Visit Shop
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownedItems.map((item) => {
              const isEquipped = equipped[item.type];
              return (
                <div
                  key={item.id}
                  className={`card p-6 ${isEquipped ? 'border-emerald-500/50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-16 h-16 rounded-xl ${
                        isEquipped ? 'bg-emerald-500/20' : 'bg-slate-700'
                      } flex items-center justify-center`}
                    >
                      {item.icon}
                    </div>
                    {isEquipped && (
                      <div className="badge badge-success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Equipped
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{item.description}</p>

                  <div className="flex gap-2">
                    {isEquipped ? (
                      <button
                        onClick={() => unequipItem(item.type)}
                        className="btn btn-ghost flex-1"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Unequip
                      </button>
                    ) : (
                      <button
                        onClick={() => equipItem(item.type)}
                        className="btn btn-primary flex-1"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Equip
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
