import { ShoppingCart, Package, CheckCircle } from 'lucide-react';

function CheckoutSteps({ current }) {
  const steps = [
    { key: 'cart', label: 'Cart', icon: <ShoppingCart size={14} /> },
    { key: 'checkout', label: 'Checkout', icon: <Package size={14} /> },
    { key: 'confirm', label: 'Confirm', icon: <CheckCircle size={14} /> }
  ];

  const currentIndex = steps.findIndex((step) => step.key === current);

  return (
    <div className="checkout-steps mb-lg text-sm">
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = step.key === current;

        return (
          <div key={step.key} className="checkout-step-item">
            <span className={`checkout-step-label ${isActive ? 'checkout-step-active' : 'checkout-step-muted'} ${isCurrent ? 'checkout-step-current' : ''}`}>
              {step.icon} {step.label}
            </span>
            {index < steps.length - 1 ? <span className="checkout-step-separator">→</span> : null}
          </div>
        );
      })}
    </div>
  );
}

export default CheckoutSteps;
