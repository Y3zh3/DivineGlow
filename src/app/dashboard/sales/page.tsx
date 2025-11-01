
'use client';
import React, { useState, useEffect } from 'react';
import type { Product, Customer, Seller, Cashier, Sale, SaleItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, X, Search, CalendarIcon, ChevronsUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { products as initialProducts, customers as initialCustomers, sellers as initialSellers, cashiers as initialCashiers } from '@/lib/data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const PRODUCTS_STORAGE_KEY = 'divine-glow-products';
const CUSTOMERS_STORAGE_KEY = 'divine-glow-customers';
const SELLERS_STORAGE_KEY = 'divine-glow-sellers';
const CASHIERS_STORAGE_KEY = 'divine-glow-cashiers';
const SALES_STORAGE_KEY = 'divine-glow-sales';

export default function SalesPage() {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [cashiers, setCashiers] = useState<Cashier[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);

    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [selectedSeller, setSelectedSeller] = useState<string>('');
    const [selectedCashier, setSelectedCashier] = useState<string>('');
    const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [openProductPopover, setOpenProductPopover] = useState(false);
    const [openSaleId, setOpenSaleId] = useState<string | null>(null);


    useEffect(() => {
        const loadData = (key: string, setter: (data: any) => void, initialData: any) => {
            try {
                const storedData = localStorage.getItem(key);
                setter(storedData ? JSON.parse(storedData) : initialData);
            } catch (error) {
                console.error(`Failed to load ${key} from localStorage`, error);
                setter(initialData);
            }
        };

        loadData(PRODUCTS_STORAGE_KEY, setProducts, initialProducts);
        loadData(CUSTOMERS_STORAGE_KEY, setCustomers, initialCustomers);
        loadData(SELLERS_STORAGE_KEY, setSellers, initialSellers);
        loadData(CASHIERS_STORAGE_KEY, setCashiers, initialCashiers);
        loadData(SALES_STORAGE_KEY, setSales, []);
    }, []);
    
    const updateSales = (updatedSales: Sale[]) => {
        setSales(updatedSales);
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(updatedSales));
    }


    const handleAddProductToSale = () => {
        if (!selectedProduct) {
            toast({ title: "Error", description: "Por favor, selecciona un producto.", variant: "destructive" });
            return;
        }

        const existingItem = saleItems.find(item => item.productId === selectedProduct.id);
        if (existingItem) {
            toast({ title: "Producto ya añadido", description: "Este producto ya está en la venta. Puedes editar la cantidad.", variant: "default" });
            return;
        }

        const newItem: SaleItem = {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: 1,
            price: selectedProduct.price,
            category: selectedProduct.category
        };
        setSaleItems([...saleItems, newItem]);
        setSelectedProduct(null);
    };

    const handleRemoveFromSale = (productId: string) => {
        setSaleItems(currentItems => currentItems.filter(item => item.productId !== productId));
    };

    const handleQuantityChange = (productId: string, quantity: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (quantity > product.stock) {
            toast({ title: "Stock insuficiente", description: `Solo quedan ${product.stock} unidades.`, variant: "destructive" });
            quantity = product.stock;
        }

        if (quantity < 1) {
            handleRemoveFromSale(productId);
            return;
        }

        setSaleItems(currentItems =>
            currentItems.map(item =>
                item.productId === productId ? { ...item, quantity } : item
            )
        );
    };
    
    const saleTotal = saleItems.reduce((total, item) => total + item.price * item.quantity, 0);
    
    const handleCreateSale = () => {
        if (!selectedCustomer || !selectedSeller || !selectedCashier || saleItems.length === 0) {
            toast({ title: "Faltan datos", description: "Completa todos los campos y añade al menos un producto.", variant: "destructive" });
            return;
        }

        const newSale: Sale = {
            id: `sale-${Date.now()}`,
            customerId: selectedCustomer,
            sellerId: selectedSeller,
            cashierId: selectedCashier,
            date: saleDate ? format(saleDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
            items: saleItems,
            total: saleTotal,
        };
        
        updateSales([newSale, ...sales]);

        toast({ title: "Venta Registrada", description: `La venta se ha registrado con éxito.`, });
        
        // Reset form
        setSaleItems([]);
        setSelectedCustomer('');
        setSelectedSeller('');
        setSelectedCashier('');
        setSaleDate(new Date());
    }

    const getNameById = (id: string, list: {id: string, name: string}[]) => {
        return list.find(item => item.id === id)?.name || 'N/A';
    }

    const toggleSaleDetails = (saleId: string) => {
        setOpenSaleId(prevId => (prevId === saleId ? null : saleId));
    };


    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Registro de Ventas</h1>
                    <p className="text-muted-foreground">Formulario para crear un nuevo registro de venta detallado.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles de la Venta</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer-select">Cliente</Label>
                                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                    <SelectTrigger id="customer-select"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="seller-select">Vendedor</Label>
                                <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                                    <SelectTrigger id="seller-select"><SelectValue placeholder="Seleccionar vendedor" /></SelectTrigger>
                                    <SelectContent>{sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="cashier-select">Cajero</Label>
                                <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                                    <SelectTrigger id="cashier-select"><SelectValue placeholder="Seleccionar cajero" /></SelectTrigger>
                                    <SelectContent>{cashiers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha de Venta</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !saleDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {saleDate ? format(saleDate, "PPP") : <span>Elige una fecha</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={saleDate} onSelect={setSaleDate} initialFocus /></PopoverContent>
                                </Popover>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader>
                            <CardTitle>Añadir Producto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label>Producto</Label>
                                <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={openProductPopover} className="w-full justify-between">
                                            {selectedProduct ? selectedProduct.name : "Seleccionar producto..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar producto..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontró el producto.</CommandEmpty>
                                                <CommandGroup>
                                                    {products.map((product) => (
                                                        <CommandItem
                                                            key={product.id}
                                                            value={product.name}
                                                            onSelect={() => {
                                                                setSelectedProduct(product);
                                                                setOpenProductPopover(false);
                                                            }}
                                                        >
                                                            {product.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {selectedProduct && (
                                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                    <p><b>Categoría:</b> {selectedProduct.category}</p>
                                    <p><b>Precio:</b> S/{selectedProduct.price.toFixed(2)}</p>
                                    <p><b>Stock:</b> {selectedProduct.stock}</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleAddProductToSale} disabled={!selectedProduct}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir a la Venta
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                {/* Sale Details Column */}
                <div className="lg:col-span-3">
                     <Card className="flex flex-col h-full">
                        <CardHeader>
                            <CardTitle>Detalle de la Venta</CardTitle>
                            <CardDescription>Productos añadidos a la venta actual.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="w-[100px]">Cantidad</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead><span className="sr-only">Quitar</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {saleItems.length > 0 ? (
                                        saleItems.map(item => (
                                            <TableRow key={item.productId}>
                                                <TableCell className="font-medium">{item.productName}</TableCell>
                                                <TableCell>{item.category}</TableCell>
                                                <TableCell>
                                                    <Input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value, 10))} className="w-20 h-8" min="1" />
                                                </TableCell>
                                                <TableCell className="text-right">S/{(item.price * item.quantity).toFixed(2)}</TableCell>
                                                <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveFromSale(item.productId)}><X className="h-4 w-4 text-destructive" /></Button></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Aún no hay productos en esta venta.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 mt-auto p-4 border-t">
                            <div className="flex justify-between w-full text-lg font-bold">
                                <span>Total General</span>
                                <span>S/{saleTotal.toFixed(2)}</span>
                            </div>
                            <Button className="w-full" size="lg" onClick={handleCreateSale} disabled={saleItems.length === 0}>
                                Registrar Venta
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Ventas Registradas</CardTitle>
                    <CardDescription>Lista de todas las ventas creadas manualmente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]"></TableHead>
                                <TableHead>Venta ID</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="hidden md:table-cell">Vendedor</TableHead>
                                <TableHead className="hidden lg:table-cell">Cajero</TableHead>
                                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        {sales.map((sale) => (
                           <Collapsible asChild key={sale.id} open={openSaleId === sale.id} onOpenChange={() => toggleSaleDetails(sale.id)}>
                                <TableBody>
                                    <TableRow>
                                         <TableCell>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-9 p-0">
                                                    {openSaleId === sale.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    <span className="sr-only">Toggle Details</span>
                                                </Button>
                                            </CollapsibleTrigger>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">#{sale.id.split('-')[1]}</TableCell>
                                        <TableCell>{getNameById(sale.customerId, customers)}</TableCell>
                                        <TableCell className="hidden md:table-cell">{getNameById(sale.sellerId, sellers)}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{getNameById(sale.cashierId, cashiers)}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{sale.date}</TableCell>
                                        <TableCell className="text-right">S/{sale.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                     <CollapsibleContent asChild>
                                        <TableRow>
                                            <TableCell colSpan={7} className="p-0">
                                                <div className="p-4 bg-muted/50">
                                                <h4 className="font-semibold mb-2">Detalles de la Venta:</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Producto</TableHead>
                                                            <TableHead>Categoría</TableHead>
                                                            <TableHead className="text-right">Cantidad</TableHead>
                                                            <TableHead className="text-right">Precio Unit.</TableHead>
                                                            <TableHead className="text-right">Subtotal</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                    {sale.items.map(item => (
                                                        <TableRow key={item.productId}>
                                                            <TableCell>{item.productName}</TableCell>
                                                            <TableCell>{item.category}</TableCell>
                                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                                            <TableCell className="text-right">S/{item.price.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">S/{(item.price * item.quantity).toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    </TableBody>
                                                </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </CollapsibleContent>
                                </TableBody>
                           </Collapsible>
                        ))}
                    </Table>
                     {sales.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            No hay ventas registradas manualmente todavía.
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
