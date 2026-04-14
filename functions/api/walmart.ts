export class WalmartService {
  private baseUrl = 'https://developer.api.walmart.com/api-proxy/service';

  constructor(
    private clientId: string,
    private clientSecret: string,
    private consumerId: string
  ) {}

  async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/identity/oauth/v1/token`, {
      method: 'POST',
      headers: {
        'WM_CONSUMER.ID': this.consumerId,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Walmart Auth Failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.access_token;
  }

  async mapIngredientsToItems(ingredients: { name: string; quantity: number; unit: string }[], zipCode: string = '50309') {
    const token = await this.getAccessToken();
    
    // Walmart Recipes API (I2P V2)
    // Note: This is a simplified version. The actual API might require a specific JSON structure.
    const response = await fetch(`${this.baseUrl}/affiliate/recipe/v2/products`, {
      method: 'POST',
      headers: {
        'WM_SEC.ACCESS_TOKEN': token,
        'WM_CONSUMER.ID': this.consumerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postalCode: zipCode,
        ingredients: ingredients.map(ing => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit
        }))
      }),
    });

    if (!response.ok) {
      throw new Error(`Walmart Product Mapping Failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async createBundleUrl(items: { itemId: string; quantity: number }[]) {
    // Generates a 'Buy Now' URL for Walmart Cart
    // items format: [{ itemId: '123', quantity: 1 }]
    const itemString = items.map(item => `${item.itemId}:${item.quantity}`).join(',');
    return `https://www.walmart.com/cart/buynow?items=${itemString}&affiliate_id=mealsxu`;
  }
}
