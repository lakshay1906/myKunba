# Framer Motion

## From Top

```
initial={{ opacity: 0, y: -30 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: 0.4 }}
viewport={{ once: false, amount: 0.3 }}
```

## From Bottom

```
initial={{ opacity: 0, y: 30 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: 0.4 }}
viewport={{ once: false, amount: 0.3 }}
```

## From Left

```
initial={{ x: -50, opacity: 0 }}
whileInView={{ x: 0, opacity: 1 }}
transition={{ duration: 0.5, delay: 0.4 }}
viewport={{ once: false, amount: 0.3 }}
```

## From Right

```
initial={{ x: 50, opacity: 0 }}
whileInView={{ x: 0, opacity: 1 }}
transition={{ duration: 0.5, delay: 0.4 }}
viewport={{ once: false, amount: 0.3 }}
```
