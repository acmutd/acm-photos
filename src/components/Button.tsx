import * as React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/cn';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:opacity-90',
                secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
            },
            size: {
                sm: 'h-9 px-3',
                md: 'h-10 px-4',
                lg: 'h-11 px-6',
            },
        },
        defaultVariants: {variant: 'default', size: 'md'},
    }
);

export function Button(
    props: React.ButtonHTMLAttributes<HTMLButtonElement> &
        VariantProps<typeof buttonVariants>
) {
    const {className, variant, size, ...rest} = props;
    return (
        <button className={cn(buttonVariants({variant, size}), className)} {...rest} />
    );
}
