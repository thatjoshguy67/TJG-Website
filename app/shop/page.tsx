import Footer from "../components/Footer";
import { ShopContentCard } from "../components/ContentCards";
import { fetchGumroadProducts } from "../../lib/gumroad-server";
import TopAppBar from "../components/TopAppBar";
import { Shopping } from "@thatjoshguy/oneui-icons";

export default async function Shop() {
  const result = await fetchGumroadProducts().then(products => ({ products, unavailable: false })).catch(() => { console.error('Shop catalogue unavailable'); return { products: [], unavailable: true }; });
  const { products, unavailable } = result;

  return (
    <div className="page">
      <div className="page-body">
        <div className="main-content">
          <TopAppBar
            title="Shop"
            hideBarTitleOnMobile
            mobileSettingsHref="/settings?from=%2Fshop"
          />

          <div className="section shop-products-section">
            <div className="theme-container">
              {products.length > 0 ? (
                <div className="shop-product-grid">
                  {products.map((product) => (
                    <ShopContentCard key={product.id} product={product} />
                  ))}
                  <a
                    href="https://thatjoshguy.gumroad.com/"
                    className="shop-gumroad-button"
                    aria-label="View all on Gumroad"
                  >
                    <Shopping size={20} color="#fff" />
                    <span>View all on Gumroad</span>
                  </a>
                </div>
              ) : (
                <div
                  className="panel"
                  style={{
                    padding: 'var(--padding-xll)',
                    minHeight: '200px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div className="body-text"><p>{unavailable ? 'The catalogue is temporarily unavailable. You can still browse the shop on Gumroad.' : 'No products available at the moment.'}</p><a href="https://thatjoshguy.gumroad.com/" target="_blank" rel="noopener noreferrer">Visit the Gumroad shop</a></div>
                </div>
              )}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
