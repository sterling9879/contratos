'use client';

import Link from 'next/link';
import { FileText, Trash2, Eye, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Contract } from '@/types';
import { formatFileSize, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

interface ContractCardProps {
  contract: Contract;
  onDelete?: (id: string) => void;
}

export function ContractCard({ contract, onDelete }: ContractCardProps) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Link
                href={`/contracts/${contract.id}`}
                className="font-medium hover:text-primary transition-colors line-clamp-1"
              >
                {contract.fileName}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>{formatFileSize(contract.fileSize)}</span>
                <span>•</span>
                <span>{contract.pageCount} paginas</span>
                <span>•</span>
                <span>{formatDate(contract.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(contract.status)}>
              {getStatusLabel(contract.status)}
            </Badge>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Link href={`/contracts/${contract.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(contract.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
