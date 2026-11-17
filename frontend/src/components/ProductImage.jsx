function ProductImage({ src, alt, className, fallbackSeed = 'default' }) {
  return <img src={src || `https://picsum.photos/seed/${fallbackSeed}/600/400`} alt={alt} className={className} loading="lazy" />;
}

export default ProductImage;
