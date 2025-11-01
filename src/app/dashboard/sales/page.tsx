
'use client';
import React, { useState, useEffect } from 'react';
import type { Product, Customer, Seller, Cashier, Sale, Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { customers as initialCustomers, sellers as initialSellers, cashiers as initialCashiers, orders as initialOrders } from '@/lib/data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const CUSTOMERS_STORAGE_KEY = 'divine-glow-customers';
const SELLERS_STORAGE_KEY = 'divine-glow-sellers';
const CASHIERS_STORAGE_KEY = 'divine-glow-cashiers';
const SALES_STORAGE_KEY = 'divine-glow-sales';
const ORDERS_STORAGE_KEY = 'divine-glow-orders';

// We'll combine manual sales and paid POS orders into one type for display
type CombinedSale = (Sale & { sourceType: 'Manual' }) | (Order & { sourceType: 'POS' });

export default function SalesPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [cashiers, setCashiers] = useState<Cashier[]>([]);
    const [combinedSales, setCombinedSales] = useState<CombinedSale[]>([]);
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
        
        loadData(CUSTOMERS_STORAGE_KEY, setCustomers, initialCustomers);
        loadData(SELLERS_STORAGE_KEY, setSellers, initialSellers);
        loadData(CASHIERS_STORAGE_KEY, setCashiers, initialCashiers);

        // Load manual sales and paid orders to create a unified report
        try {
            const storedManualSales: Sale[] = JSON.parse(localStorage.getItem(SALES_STORAGE_KEY) || '[]');
            const storedOrders: Order[] = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');

            const paidOrders = storedOrders.filter(o => o.status === 'Pagado');
            
            const allSales: CombinedSale[] = [
                ...storedManualSales.map(s => ({ ...s, sourceType: 'Manual' as const })),
                ...paidOrders.map(o => ({ ...o, sourceType: 'POS' as const }))
            ];
            
            // Sort by date, most recent first
            allSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setCombinedSales(allSales);
        } catch (error) {
            console.error('Failed to load sales/orders data', error);
        }

    }, []);
    

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
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reporte de Ventas</h1>
                    <p className="text-muted-foreground">Listado detallado de todas las transacciones finalizadas.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Transacciones</CardTitle>
                    <CardDescription>Lista de todas las ventas pagadas (POS) y registradas manualmente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]"></TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="hidden md:table-cell">Vendedor/Cajero</TableHead>
                                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                                <TableHead className="hidden lg:table-cell">Origen</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        {combinedSales.map((sale) => (
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
                                        <TableCell>
                                            {sale.sourceType === 'Manual' ? getNameById(sale.customerId, customers) : sale.customerName}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {sale.sourceType === 'Manual'
                                                ? `${getNameById(sale.sellerId, sellers)} / ${getNameById(sale.cashierId, cashiers)}`
                                                : sale.sellerName || 'N/A'
                                            }
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">{sale.date}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{sale.sourceType}</TableCell>
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
                                                            <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                                                            <TableHead className="text-right">Cantidad</TableHead>
                                                            <TableHead className="text-right">Precio Unit.</TableHead>
                                                            <TableHead className="text-right">Subtotal</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                    {sale.items.map(item => (
                                                        <TableRow key={item.productId}>
                                                            <TableCell>{item.productName}</TableCell>
                                                            <TableCell className="hidden sm:table-cell">
                                                                {'category' in item ? item.category : products.find(p => p.id === item.productId)?.category || 'N/A'}
                                                            </TableCell>
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
                     {combinedSales.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            No hay ventas finalizadas para mostrar.
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
