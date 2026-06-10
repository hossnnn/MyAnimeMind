import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Wallet, Star, Palette, Trophy, Zap, Lock, CheckCircle2 } from 'lucide-react';

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

export default function ShopPage() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<number>(0);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: profileData } = await supabase
      .from('profiles')
      .select('tokens')
      .eq('id', user!.id)
      .single();

    const { data: purchaseData } = await supabase
      .from('user_purchases')
      .select('item_type')
      .eq('user_id', user!.id);

    if (profileData) {
      setTokens(profileData.tokens);
    }
    if (purchaseData) {
      const itemTypes = purchaseData.map((p) => p.item_type as string);
      setPurchases(itemTypes);
    }

    setLoading(false);
  };

  const buyItem = async (item: ShopItem) => {
    if (!user || tokens < item.price) {
      setMessage('Not enough tokens!');
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    await supabase
      .from('profiles')
      .update({ tokens: tokens - item.price })
      .eq('id', user.id);

    await supabase.from('user_purchases').insert({
      user_id: user.id,
      item_type: item.type,
      item_data: { purchased_at: new Date().toISOString() },
    });

    await supabase.from('token_transactions').insert({
      user_id: user.id,
      amount: -item.price,
      reason: `Purchased ${item.name}`,
    });

    await loadData();
    setMessage(`Successfully purchased ${item.name}!`);
    setSelectedItem(null);
    setTimeout(() => setMessage(null), 3000);
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-lg">Sign in to access the shop</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading shop...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <ShoppingBag className="w-8 h-8 text-indigo-400" />
                  Token Shop
                </h1>
                <p className="text-slate-400">Spend your Mind Tokens on exclusive profile customizations</p>
              </div>
              <div className="card px-6 py-4 flex items-center gap-3">
                <Wallet className="w-6 h-6 text-indigo-400" />
                <div>
                  <div className="text-sm text-slate-400">Your Balance</div>
                  <div className="text-2xl font-bold text-white">{tokens}</div>
                </div>
              </div>
            </div>

            {message && (
              <div className="mb-6 p-4 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-center animate-fadeIn">
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shopItems.map((item) => {
                const owned = purchases.includes(item.type);
                const canAfford = tokens >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`card card-hover p-6 ${owned ? 'border-emerald-500/50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-16 h-16 rounded-xl ${
                          owned ? 'bg-emerald-500/20' : 'bg-slate-700'
                        } flex items-center justify-center`}
                      >
                        {item.icon}
                      </div>
                      {owned && (
                        <div className="badge badge-success">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Owned
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{item.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xl font-bold ${
                            canAfford || owned ? 'text-indigo-400' : 'text-red-400'
                          }`}
                        >
                          {item.price}
                        </span>
                        <span className="text-slate-400 text-sm">tokens</span>
                      </div>

                      {owned ? (
                        <button disabled className="btn btn-success btn-sm opacity-50">
                          Owned
                        </button>
                      ) : canAfford ? (
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="btn btn-primary btn-sm"
                        >
                          Purchase
                        </button>
                      ) : (
                        <button disabled className="btn btn-secondary btn-sm opacity-50">
                          Not enough tokens
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">Ways to Earn Tokens</h2>
              <div className="card p-6">
                <div className="divide-y divide-slate-700">
                  {[
                    { action: 'Daily login', tokens: 5 },
                    { action: 'Rating an anime', tokens: 2 },
                    { action: 'Completing a series', tokens: 10 },
                    { action: 'Writing a review (100+ chars)', tokens: 15 },
                    { action: 'Referral (friend signs up)', tokens: 50 },
                    { action: 'Filler correction approved', tokens: 15 },
                    { action: 'Mood Matcher recommendation + rate within 7 days', tokens: 10 },
                  ].map((reward, i) => (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <span className="text-slate-300">{reward.action}</span>
                      <span className="text-indigo-400 font-medium">+{reward.tokens} tokens</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {selectedItem && (
          <div className="modal-overlay animate-fadeIn" onClick={() => setSelectedItem(null)}>
            <div className="modal-content animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-xl bg-slate-700 flex items-center justify-center mb-4">
                  {selectedItem.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{selectedItem.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{selectedItem.description}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-indigo-400">{selectedItem.price}</span>
                  <span className="text-slate-400">tokens</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-700/50 mb-4 text-center">
                <span className="text-slate-400">Balance after purchase: </span>
                <span
                  className={`font-bold ${
                    tokens >= selectedItem.price ? 'text-white' : 'text-red-400'
                  }`}
                >
                  {tokens >= selectedItem.price ? tokens - selectedItem.price : 'Insufficient'}
                </span>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelectedItem(null)} className="btn btn-ghost flex-1">
                  Cancel
                </button>
                <button
                  onClick={() => buyItem(selectedItem)}
                  disabled={tokens < selectedItem.price}
                  className="btn btn-primary flex-1"
                >
                  Confirm Purchase
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
