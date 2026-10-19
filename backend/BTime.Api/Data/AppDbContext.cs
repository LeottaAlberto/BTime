using System;
using System.Collections.Generic;
using BTime.Api.Models;
using Microsoft.EntityFrameworkCore;
using File = BTime.Api.Models.File;

namespace BTime.Api.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext(){}

    public AppDbContext(DbContextOptions<AppDbContext> options): base(options){}

    public virtual DbSet<File> Files { get; set; }

    public virtual DbSet<Folder> Folders { get; set; }

    public virtual DbSet<ImagesD> ImagesDs { get; set; }

    public virtual DbSet<ImagesM> ImagesMs { get; set; }

    public virtual DbSet<MenuD> MenuDs { get; set; }

    public virtual DbSet<MenuM> MenuMs { get; set; }

    public virtual DbSet<MoviesD> MoviesDs { get; set; }

    public virtual DbSet<MoviesM> MoviesMs { get; set; }

    public virtual DbSet<Photo> Photos { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<TagsD> TagsDs { get; set; }

    public virtual DbSet<TagsM> TagsMs { get; set; }

    public virtual DbSet<Users> Users { get; set; }
    public virtual DbSet<UserDeviceActive> UserDeviceActive { get; set; }
    public virtual DbSet<SeriesM> SeriesMs { get; set; }
    public virtual DbSet<SeasonsM> SeasonsMs { get; set; }
    public virtual DbSet<EpisodesM> EpisodesMs { get; set; }
    public virtual DbSet<EpisodesD> EpisodesDs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<File>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Files_pkey");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.DeletedAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.MimeType).HasMaxLength(255);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Path).HasMaxLength(200);
            entity.Property(e => e.RFolderId).HasColumnName("R_FolderId");
            entity.Property(e => e.RUserId).HasColumnName("R_UserId");

            entity.HasOne(d => d.RFolder).WithMany(p => p.Files)
                .HasForeignKey(d => d.RFolderId)
                .HasConstraintName("Files_R_FolderId_fkey");

            entity.HasOne(d => d.RUsers).WithMany(p => p.Files)
                .HasForeignKey(d => d.RUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Files_R_UserId_fkey");
        });

        modelBuilder.Entity<Folder>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Folders_pkey");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.DeletedAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.RFolderId).HasColumnName("R_FolderId");
            entity.Property(e => e.RUserId).HasColumnName("R_UserId");

            entity.HasOne(d => d.RFolder).WithMany(p => p.InverseRFolder)
                .HasForeignKey(d => d.RFolderId)
                .HasConstraintName("Folders_R_FolderId_fkey");

            entity.HasOne(d => d.RUsers).WithMany(p => p.Folders)
                .HasForeignKey(d => d.RUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Folders_R_UserId_fkey");
        });

        modelBuilder.Entity<ImagesD>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ImagesD_pkey");

            entity.ToTable("ImagesD");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.RImageMId).HasColumnName("R_ImageMId");
            entity.Property(e => e.RMovieMId).HasColumnName("R_MovieMId");
            entity.Property(e => e.RSeriesMId).HasColumnName("R_SeriesMId");

            entity.HasOne(d => d.RImageM).WithMany(p => p.ImagesDs)
                .HasForeignKey(d => d.RImageMId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ImagesD_R_ImageMId_fkey");

            entity.HasOne(d => d.RMovieM).WithMany()
                .HasForeignKey(d => d.RMovieMId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("ImagesD_R_MovieMId_fkey");

            entity.HasOne(d => d.RSeriesM).WithMany(p => p.ImagesDs)
                .HasForeignKey(d => d.RSeriesMId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("ImagesD_R_SeriesMId_fkey");
        });

        modelBuilder.Entity<ImagesM>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ImagesM_pkey");

            entity.ToTable("ImagesM");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Path).HasMaxLength(200);
        });

        modelBuilder.Entity<MenuD>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("MenuD_pkey");

            entity.ToTable("MenuD");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.RMenuMid).HasColumnName("R_MenuMId");
            entity.Property(e => e.RUserId).HasColumnName("R_UserId");

            entity.HasOne(d => d.RMenuM).WithMany(p => p.MenuDs)
                .HasForeignKey(d => d.RMenuMid)
                .HasConstraintName("MenuD_R_MenuMId_fkey");

            entity.HasOne(d => d.RUsers).WithMany(p => p.MenuDs)
                .HasForeignKey(d => d.RUserId)
                .HasConstraintName("MenuD_R_UserId_fkey");
        });

        modelBuilder.Entity<MenuM>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("MenuM_pkey");

            entity.ToTable("MenuM");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.RImageMid).HasColumnName("R_ImageMId");
            entity.Property(e => e.RMenuMid).HasColumnName("R_MenuMId");
            entity.Property(e => e.Route).HasMaxLength(200);

            entity.HasOne(d => d.RImageM).WithMany(p => p.MenuMs)
                .HasForeignKey(d => d.RImageMid)
                .HasConstraintName("MenuM_R_ImageMId_fkey");

            entity.HasOne(d => d.RMenuM).WithMany(p => p.InverseRMenuM)
                .HasForeignKey(d => d.RMenuMid)
                .HasConstraintName("MenuM_R_MenuMId_fkey");
        });

        modelBuilder.Entity<MoviesD>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("MoviesD_pkey");

            entity.ToTable("MoviesD");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.LastWatchedAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.RMoviesMid).HasColumnName("R_MoviesMId");
            entity.Property(e => e.RUserId).HasColumnName("R_UserId");

            entity.HasOne(d => d.RMoviesM).WithMany(p => p.MoviesDs)
                .HasForeignKey(d => d.RMoviesMid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("MoviesD_R_MoviesMId_fkey");

            entity.HasOne(d => d.RUsers).WithMany(p => p.MoviesDs)
                .HasForeignKey(d => d.RUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("MoviesD_R_UserId_fkey");
        });

        modelBuilder.Entity<MoviesM>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("MoviesM_pkey");

            entity.ToTable("MoviesM");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.DeletedAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Path).HasMaxLength(200);
            entity.Property(e => e.RImagesMid).HasColumnName("R_ImagesMId");
            entity.Property(e => e.RUserId).HasColumnName("R_UserId");
            entity.Property(e => e.Title).HasMaxLength(100);

            entity.HasOne(d => d.RImagesM).WithMany(p => p.MoviesMs)
                .HasForeignKey(d => d.RImagesMid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("MoviesM_R_ImagesMId_fkey");

            entity.HasOne(d => d.RUsers).WithMany(p => p.MoviesMs)
                .HasForeignKey(d => d.RUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("MoviesM_R_UserId_fkey");
        });

        modelBuilder.Entity<Photo>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Photos_pkey");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.DeletedAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.ExifDataJson).HasColumnType("jsonb");
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Path).HasMaxLength(200);
            entity.Property(e => e.RFolderId).HasColumnName("R_FolderId");
            entity.Property(e => e.RUserId).HasColumnName("R_UserId");
            entity.Property(e => e.TakedAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.ThumbnailPath).HasMaxLength(200);

            entity.HasOne(d => d.RFolder).WithMany(p => p.Photos)
                .HasForeignKey(d => d.RFolderId)
                .HasConstraintName("Photos_R_FolderId_fkey");

            entity.HasOne(d => d.RUsers).WithMany(p => p.Photos)
                .HasForeignKey(d => d.RUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Photos_R_UserId_fkey");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Roles_pkey");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.Name).HasMaxLength(50);
        });

        modelBuilder.Entity<TagsD>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("TagsD_pkey");

            entity.ToTable("TagsD");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.RMovieMid).HasColumnName("R_MovieMId");
            entity.Property(e => e.RSeriesMid).HasColumnName("R_SeriesMId");
            entity.Property(e => e.RTagMid).HasColumnName("R_TagMId");

            entity.HasOne(d => d.RMovieM).WithMany(p => p.TagsDs)
                .HasForeignKey(d => d.RMovieMid)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("TagsD_R_MovieMId_fkey");

            entity.HasOne(d => d.RSeriesM).WithMany(p => p.TagsDs)
                .HasForeignKey(d => d.RSeriesMid)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("TagsD_R_SeriesMId_fkey");

            entity.HasOne(d => d.RTagM).WithMany(p => p.TagsDs)
                .HasForeignKey(d => d.RTagMid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("TagsD_R_TagMId_fkey");
        });

        modelBuilder.Entity<TagsM>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("TagsM_pkey");

            entity.ToTable("TagsM");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Name).HasMaxLength(50);
        });

        modelBuilder.Entity<Users>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Users_pkey");

            entity.HasIndex(e => e.Id, "Users_unique_0").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.LastLoginAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.Password).HasMaxLength(255);
            entity.Property(e => e.RRoleId).HasColumnName("R_RoleId");
            entity.Property(e => e.Username).HasMaxLength(50);

            entity.HasOne(d => d.RRole).WithMany(p => p.Users)
                .HasForeignKey(d => d.RRoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Users_R_RoleId_fkey");
        });

        modelBuilder.Entity<UserDeviceActive>()
                .HasOne(d => d.User)
                .WithMany(u => u.ActiveDevices)
                .HasForeignKey(d => d.R_UserId)
                .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserDeviceActive>()
            .HasIndex(d => d.RefreshToken)
            .IsUnique();

        modelBuilder.Entity<SeriesM>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("SeriesM_pkey");

            entity.ToTable("SeriesM");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp with time zone");
            entity.Property(e => e.DeletedAt).HasColumnType("timestamp with time zone");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Rating).HasColumnType("decimal(3, 1)");
            entity.Property(e => e.RImagesMid).HasColumnName("R_ImagesMId");
            entity.Property(e => e.RUserId).HasColumnName("R_UserId");
            entity.Property(e => e.Title).HasMaxLength(150);

            entity.HasOne(d => d.RImagesM).WithMany(p => p.SeriesMs)
                .HasForeignKey(d => d.RImagesMid)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("SeriesM_R_ImagesMId_fkey");

            entity.HasOne(d => d.RUsers).WithMany(p => p.SeriesMs)
                .HasForeignKey(d => d.RUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("SeriesM_R_UserId_fkey");
        });

        modelBuilder.Entity<SeasonsM>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("SeasonsM_pkey");

            entity.ToTable("SeasonsM");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp with time zone");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.RSeriesMid).HasColumnName("R_SeriesMId");
            entity.Property(e => e.Title).HasMaxLength(100);

            entity.HasOne(d => d.RSeriesM).WithMany(p => p.SeasonsMs)
                .HasForeignKey(d => d.RSeriesMid)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("SeasonsM_R_SeriesMId_fkey");
        });

        modelBuilder.Entity<EpisodesM>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("EpisodesM_pkey");

            entity.ToTable("EpisodesM");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp with time zone");
            entity.Property(e => e.DeletedAt).HasColumnType("timestamp with time zone");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Path).HasMaxLength(500);
            entity.Property(e => e.RImagesMid).HasColumnName("R_ImagesMId");
            entity.Property(e => e.RSeasonMid).HasColumnName("R_SeasonMId");
            entity.Property(e => e.Title).HasMaxLength(150);

            entity.HasOne(d => d.RImagesM).WithMany(p => p.EpisodesMs)
                .HasForeignKey(d => d.RImagesMid)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("EpisodesM_R_ImagesMId_fkey");

            entity.HasOne(d => d.RSeasonM).WithMany(p => p.EpisodesMs)
                .HasForeignKey(d => d.RSeasonMid)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("EpisodesM_R_SeasonMId_fkey");
        });

        modelBuilder.Entity<EpisodesD>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("EpisodesD_pkey");

            entity.ToTable("EpisodesD");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.LastWatchedAt).HasColumnType("timestamp with time zone");
            entity.Property(e => e.REpisodeMid).HasColumnName("R_EpisodeMId");
            entity.Property(e => e.RUserId).HasColumnName("R_UserId");

            entity.HasOne(d => d.REpisodeM).WithMany(p => p.EpisodesDs)
                .HasForeignKey(d => d.REpisodeMid)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("EpisodesD_R_EpisodeMId_fkey");

            entity.HasOne(d => d.RUsers).WithMany(p => p.EpisodesDs)
                .HasForeignKey(d => d.RUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("EpisodesD_R_UserId_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
